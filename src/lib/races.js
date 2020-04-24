import moment, { duration } from 'moment';
import season from '../data/season.json';
import levelToClass, { levelToClassNumber } from './levelToClass';
import raceTimesArray from '../data/raceTimes';

const raceTimesById = raceTimesArray.reduce((races, race) => ({ ...races, [race.seriesId]: race }), {});

const now = moment().utc();
const startOfWeek = now.clone().subtract(1, 'days').startOf('isoWeek').add(1, 'days');

function getNextRaceFromRecur(everyTime, offset) {
  const nextDate = startOfWeek.clone().add(offset);
  const endDate = startOfWeek.clone().add({ weeks: 1, days: 1 });

  while (nextDate.isBefore(now) && nextDate.isBefore(endDate)) {
    nextDate.add(everyTime);
  }

  if (nextDate.isBefore(now)) {
    return null;
  }

  return nextDate;
}

function getNextRaceSetTimes(setTimes) {
  for (const time of setTimes) {
    const date = startOfWeek.clone().add(time);
    if (date.isAfter(now)) {
      return date;
    }
  }

  const firstNextWeek = startOfWeek.clone().add(1, 'weeks').add(setTimes[0]);

  if (firstNextWeek.isAfter(now)) {
    return firstNextWeek;
  }

  return null;
}

const getType = (catId) => {
  const categories = {
    1: 'Oval',
    2: 'Road',
    3: 'Dirt',
    4: 'RX'
  };

  return categories[catId];
};

export default season.reduce((carry, series) => {
  const raceTimes = raceTimesById[series.seriesid] || {};

  const seriesName = series.seriesname;
  const seriesStart = moment(series.start, 'x').utc().startOf('day');

  if (raceTimes.weekStartOffset) {
    seriesStart.add(raceTimes.weekStartOffset);
  }

  const seriesEnd = moment(series.end, 'x').utc().startOf('isoWeek').add({ days: 1 });

  if (raceTimes.weekEndOffset) {
    seriesEnd.add(raceTimes.weekEndOffset);
  }

  const offWeeks = raceTimes.offWeeks || [];
  const raceWeekLength = Math.round(moment(seriesEnd).diff(seriesStart) / (series.tracks.length + offWeeks.length));

  const allRaceWeeks = series.tracks.map((track) => track.raceweek)
    .concat(offWeeks.map((offWeek) => offWeek - 1));

  allRaceWeeks.sort((a, b) => a - b);

  return carry.concat(series.tracks.map((track) => {
    const trackName = track.name;
    let nextTime = null;

    const realRaceWeek = allRaceWeeks.indexOf(track.raceweek);

    if (raceTimes.everyTime) {
      nextTime = getNextRaceFromRecur(raceTimes.everyTime, raceTimes.offset);
    }

    if (raceTimes.setTimes) {
      nextTime = getNextRaceSetTimes(raceTimes.setTimes);
    }

    const startTime = moment(seriesStart).add(raceWeekLength * realRaceWeek, 'ms').startOf('day').utc();
    const weekLength = duration(raceWeekLength);

    const type = getType(series.catid);

    return {
      series: seriesName,
      seriesId: series.seriesid,
      track: track.name,
      trackId: track.pkgid,
      week: track.raceweek,
      startTime,
      weekLength,
      endTime: moment(startTime).add(weekLength),
      official: series.isOfficial,
      licenceLevel: series.minlicenselevel,
      licenceClassNumber: levelToClassNumber(series.minlicenselevel),
      licenceClass: levelToClass(series.minlicenselevel, true),
      type,
      fixed: series.isFixedSetup,
      carClasses: series.carclasses.map(({ shortname }) => shortname),
      carIds: series.cars.map(({ sku }) => sku),
      raceTimes,
      nextTime,
      seriesStart,
      seriesEnd,
      seasonId: series.seasonid
    };
  }));
}, []);

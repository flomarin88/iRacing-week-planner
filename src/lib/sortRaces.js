import columns from '../data/availableColumns';

const columnsById = columns.reduce((columnObject, column) => {
  columnObject[column.id] = column;
  return columnObject;
}, {});

export default (rule, unordered) => {
  const races = [...unordered];

  races.sort(columnsById[rule.key].sort.bind(null, rule.order));

  return races;
};

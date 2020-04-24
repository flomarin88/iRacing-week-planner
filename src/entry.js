import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import configureStore from './store/configureStore';

let HotApp = App;

if (process.env.NODE_ENV === 'development') {
  const { hot } = require('react-hot-loader/root');

  HotApp = hot(App);
}

ReactDOM.render(
  <Provider store={configureStore({})}>
    <HotApp />
  </Provider>,
  document.getElementById('root')
);

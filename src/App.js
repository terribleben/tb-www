import React, { Component } from 'react';
import './App.css';

const sections = [
  {
    id: 'current',
    title: 'Recently working on',
    items: [
      {
        name: 'Castle',
        url: 'https://castle.games',
      },
      {
        name: 'Bit Graves',
        url: 'http://bitgraves.com',
      },
      {
        name: 'Expo',
        url: 'http://expo.io',
      },
    ],
  },
  {
    id: 'stuff',
    title: 'Some stuff',
    items: [
      {
        name: 'PitShift',
        url: 'https://reading.supply/@ben/implementing-a-pitch-shifter-in-supercollider-Z0fcAX',
      },
      {
        name: 'Circloid',
        url: 'https://castle.games/+2/@ben/circloid',
      },
      {
        name: 'Endless Library',
        url: 'https://terribleben.itch.io/endless-library',
      },
      {
        name: 'Goat machine',
        url: 'http://terribleben.com/demo/goatmachine0',
      },
    ],
  },
  {
    id: 'contact',
    title: 'Reach me',
    items: [
      {
        name: 'Twitter',
        url: 'https://twitter.com/terribleben',
      },
      {
        name: 'Github',
        url: 'https://github.com/terribleben',
      },
    ],
  },
];

export default class App extends Component {
  _renderSection = (section) => {
    return (
      <div id={section.id} key={section.id} class="topic">
        <h1>{section.title}</h1>
        {section.items.map((item) => (
          <ul key={item.name}>
            <li><a href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a></li>
          </ul>
        ))}
      </div>
    );
  };

  render() {
    return (
      <div className="App">
        <div id="intro">
          <p>I'm <span id="ben">Ben Roth</span>, a programmer and musician living in Seattle.</p>
        </div>
        <div id="container">
          {sections.map(this._renderSection)}
        </div>
      </div>
    );
  }
}

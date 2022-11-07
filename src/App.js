import React, { Component } from "react";
import "./App.css";

const sections = [
  {
    id: "current",
    title: "Recently working on",
    items: [
      {
        name: "Castle",
        url: "https://castle.xyz",
        description: "a way to make interactive art on your phone"
      },
      {
        name: "Bit Graves",
        url: "http://bitgraves.com",
        description: "an experimental drone/noise band"
      },
      {
        name: "Writing",
        url: "https://reading.supply/@ben/",
        description: "mostly about Bit Graves"
      },
      {
        name: "Untitled Dungeon",
        url: "https://terribleben.itch.io/untitled-dungeon",
        description: "a small pixel world which hides a mystery"
      },
      {
        name: "Untitled Dungeon OST",
        url: "https://terribleben.bandcamp.com/album/untitled-dungeon-ost",
        description: "the soundtrack for that game"
      },
      {
        name: "Expo",
        url: "http://expo.io",
        description: "an app creation tool"
      },
      {
        name: "PitShift",
        url:
          "https://reading.supply/@ben/implementing-a-pitch-shifter-in-supercollider-Z0fcAX",
        description: "a SuperCollider pitch shifter"
      },
      {
        name: "Circloid",
        url: "https://castle.games/+2/@ben/circloid",
        description: "a lua game"
      },
      {
        name: "Structures",
        url: "https://terribleben.bandcamp.com/album/structures",
        description: "textural electronic ChucK music"
      },
      {
        name: "AM Sonora",
        url: "https://terribleben.bandcamp.com/album/am-sonora",
        description: "synthesizer border music"
      },
      {
        name: "chuck-mode",
        url: "https://github.com/terribleben/chuck-mode",
        description: "emacs and ChucK"
      },
      {
        name: "Endless Library",
        url: "https://terribleben.itch.io/endless-library",
        description: "a procedurally generated library"
      },
      {
        name: "Goat machine",
        url: "/demo/goatmachine0",
        description: "a WebAudio formant synthesizer"
      },
      {
        name: "Terrible Sync",
        url: "https://github.com/terribleben/terrible-sync",
        description: "a voltage metronome"
      },
      {
        name: "Runabout",
        url: "https://castle.games/+37/@ben/runabout",
        description: "an abstract lander game"
      },
      {
        name: "Torus",
        url: "https://www.youtube.com/watch?v=vNhct2wUPIc",
        description: "revolving steelpans"
      },
      {
        name: "Soundcloud",
        url: "https://soundcloud.com/terribleben",
        description: "old tracks"
      },
      {
        name: "Mastodon",
        url: "https://post.lurk.org/@terribleben",
        description: "a way to reach me",
        me: true,
      },
      {
        name: "Github",
        url: "https://github.com/terribleben",
        description: "source code"
      }
    ]
  }
];

export default class App extends Component {
  _renderSection = section => {
    return (
      <div id={section.id} key={section.id} class="topic">
        {section.items.map(item => (
          <div className="item" key={item.name}>
            <a href={item.url} target="_blank" rel={item.me ? 'me noopener noreferrer' : 'noopener noreferrer'}>
              {item.name}
            </a>
            , <span className="description">{item.description}</span>
          </div>
        ))}
      </div>
    );
  };

  render() {
    return (
      <div id="container">
        <div id="content">
          {sections.map(this._renderSection)}
          <div id="intro">
            <p>
              <span id="ben">Ben Roth</span>, a programmer and musician living
              in Seattle
            </p>
          </div>
        </div>
      </div>
    );
  }
}

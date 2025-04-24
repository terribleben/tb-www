import React, { Component } from "react";
import "./App.css";

const sections = [
  {
    id: "new",
    title: "New",
    items: [
      {
        name: "Airlock Etiquette",
        url: "https://alcala-roth.bandcamp.com/album/airlock-etiquette",
        description: "new EP releasing May 2, 2025"
      }
    ]
  },
  {
    id: "current",
    title: "Recently working on",
    items: [
      {
        name: "Pharmacy & Gift Shop",
        url: "https://alcala-roth.bandcamp.com/album/pharmacy-gift-shop",
        description: "musical sketches for tidalcycles and hardware"
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
        name: "Huerto de Vidrio",
        url: "https://www.youtube.com/watch?v=3jPsO2jIU20",
        description: "a visualizer created with Hydra"
      },
      /* {
        name: "Baikal",
        url: "https://www.youtube.com/watch?v=HjcY6ooLjvM",
        description: "a visualizer created with Hydra"
      }, */
      {
        name: "norns-sandbox",
        url: "https://github.com/bitgraves/norns-sandbox",
        description: "SuperCollider patches for monome norns"
      },
      {
        name: "Castle",
        url: "https://castle.xyz",
        description: "a way to make interactive art on your phone"
      },
      {
        name: "hey buddy",
        url: "https://castle.xyz/d/nWSp1fQdX",
        description: "a game about tv and corn"
      },
      {
        name: "recyclebrain",
        url: "https://castle.xyz/d/nWSp1fQdX",
        description: "another dreamcore game"
      },
      /* {
        name: "Untitled Dungeon",
        url: "https://terribleben.itch.io/untitled-dungeon",
        description: "a small pixel world which hides a mystery"
      }, */
      /* {
        name: "Untitled Dungeon OST",
        url: "https://alcala-roth.bandcamp.com/album/untitled-dungeon-ost",
        description: "the soundtrack for that game"
      }, */
      /* {
        name: "Expo",
        url: "http://expo.dev",
        description: "an app creation tool"
      }, */
      {
        name: "PitShift",
        url:
          "https://reading.supply/@ben/implementing-a-pitch-shifter-in-supercollider-Z0fcAX",
        description: "a SuperCollider pitch shifter"
      },
      /* {
        name: "Circloid",
        url: "https://github.com/terribleben/circloid",
        description: "a lua game"
      }, */
      {
        name: "Structures",
        url: "https://alcala-roth.bandcamp.com/album/structures",
        description: "textural electronic ChucK music"
      },
      {
        name: "AM Sonora",
        url: "https://alcala-roth.bandcamp.com/album/am-sonora",
        description: "synthesizer border music"
      },
      /* {
        name: "chuck-mode",
        url: "https://github.com/terribleben/chuck-mode",
        description: "emacs and ChucK"
      },
      {
        name: "Endless Library",
        url: "https://github.com/terribleben/endless-library",
        description: "a procedurally generated library"
      },
      {
        name: "Goat machine",
        url: "/demo/goatmachine0",
        description: "a WebAudio formant synthesizer"
      }, */
      {
        name: "Terrible Sync",
        url: "https://github.com/terribleben/terrible-sync",
        description: "a voltage metronome"
      },
      /* {
        name: "Runabout",
        url: "https://github.com/terribleben/runabout",
        description: "an abstract lander game"
      }, */
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
        name: "Lurk",
        url: "https://post.lurk.org/@terribleben",
        description: "a way to reach me",
        me: true
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
      <div id={section.id} key={section.id} className="topic">
        {section.items.map(item => (
          <div className="item" key={item.name}>
            <a
              href={item.url}
              target="_blank"
              rel={item.me ? "me noopener noreferrer" : "noopener noreferrer"}
            >
              {item.name}
            </a>
            {item.description?.length ? (
              <span>
                , <span className="description">{item.description}</span>
              </span>
            ) : null}
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
              <span id="ben">Ben</span>, a programmer and musician living in
              Seattle
            </p>
          </div>
        </div>
      </div>
    );
  }
}

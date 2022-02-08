import type { NextPage } from "next";
import Head from "next/head";
import React, { useCallback, useState } from "react";
import styles from "../styles/Home.module.css";
import { One } from "../synths/one";
import { Two } from "../synths/two";
import { Three } from "../synths/three";
import { Four } from "../synths/four";
import { Five } from "../synths/five";
import { Six } from "../synths/six";
import { Seven } from "../synths/seven";

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>synthruary</title>
        <meta name="description" content="chromakode's synthruary" />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <main className={styles.main}>
        <h1>
          <a
            href="https://twitter.com/search?q=%23synthruary"
            target="_blank"
            rel="noreferrer"
          >
            #synthruary
          </a>
        </h1>

        <a href="#6">
          <h2 id="6">6. drones</h2>
        </a>
        <Six />

        <a href="#5">
          <h2 id="5">5. aleatoric &mdash; &ldquo;mRNA-1273&rdquo;</h2>
        </a>
        <Five />

        <a href="#4">
          <h2 id="4">4. pick a mode</h2>
        </a>
        <Four />

        <a href="#3">
          <h2 id="3">3. musique concrète &mdash; &ldquo;garbage day&rdquo;</h2>
        </a>
        <Three />

        <a href="#2">
          <h2 id="2">2. arpeggiators</h2>
        </a>
        <Two />

        <a href="#1">
          <h2 id="1">1. minimalism</h2>
        </a>
        <One />
      </main>
    </div>
  );
};

export default Home;

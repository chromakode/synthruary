import type { NextPage } from "next";
import Head from "next/head";
import React from "react";
import styles from "../styles/Home.module.css";
import { One } from "../synths/one";
import { Two } from "../synths/two";
import { Three } from "../synths/three";

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

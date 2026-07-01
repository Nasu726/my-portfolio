---
title: "RtoJ-anki-register"
description: "ロシア語の単語を入力すると、自動でネット辞書から意味を取得してAnkiにカードを登録するCLIアプリです。ファイル読み込み・部分一致検索・基本形推測などの機能もあります。"
pubDate: 2026-01-08
tags: ["Python", "CLI"]
links:
  github: "https://github.com/Nasu726/RtoJ-anki-register"
---

## RtoJ-anki-register

ロシア語学習のために作ったAnki単語カード自動登録CLIアプリです。

### 背景

ロシア語を学ぶ中で、単語を調べてAnkiに登録する作業が煩雑でした。辞書を開いて、意味をコピーして、Ankiに貼り付けて…という繰り返しを自動化するために作りました。

### 主な機能

- ロシア語単語を入力 → ネット辞書から意味を自動取得 → Ankiにカード登録
- テキストファイルからの一括読み込み
- 部分一致検索
- 基本形（原形）の推測

### 技術

- Python
- AnkiConnect API

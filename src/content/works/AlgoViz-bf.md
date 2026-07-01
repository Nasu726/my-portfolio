---
title: "AlgoViz - Brainfuck ビジュアライザ"
description: "Brainfuckのビジュアライザ兼エディタ。実行の様子をテープ上でリアルタイムに可視化し、ステップ実行やステップバックにも対応。様々なアルゴリズム可視化を目指すAlgoVizのv1.0。"
pubDate: 2026-02-21
tags: ["Visualizer", "Brainfuck", "React", "C++"]
links:
  github: "https://github.com/Nasu726/AlgoViz"
  demo: "https://algoviz.nasu.uk"
---

## AlgoViz - Brainfuck

Brainfuckの実行をリアルタイムで可視化するビジュアライザ兼エディタです。

### 技術構成

- **フロントエンド**: React (Vite)
- **インタープリタ**: C++ → WebAssembly (Emscripten)

### 主な機能

- コード編集・実行 / 一時停止 / ステップ実行 / ステップバック
- テープのセル値・文字・アドレス・ポインタ位置をリアルタイム表示
- 実行速度変更（インターバル: 0〜1秒）
- ポインタ自動追従とカメラ手動制御
- コードの保存
- ヘルプ（文法・キーボードショートカット）

### AlgoVizについて

VisuAlgoの完全日本語版+αを目標に、様々なアルゴリズム・データ構造・機械の動作を可視化するWebアプリとして継続開発予定。

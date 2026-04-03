---
pubDate: "2026-04-01"
title: "heapqが使いづらいのでpriority_queueを自作した話"
description: "Pythonの標準ライブラリheapqが使いづらすぎたので、PyPy環境でheapqよりも高速に動くライブラリを自作しました" # タイトルの下に出る概要
heroImage: "/python-logo-only.svg"  # 空文字列でデフォルト画像 
badge: [""] # 短いアピール(Update, v1.0, FOSS, Premium, Recommended)
tags: ["Python", "Library"]  # キーワード
---

## priority_queueのライブラリを自作しました

競技プログラミングをしていると優先度付きキューが必要になる場面があります。C++では`priority_queue`、Pythonでは`heapq`が標準で提供されていますが、`heapq`ってめちゃくちゃ使いづらくありませんか？

**heapqが使いづらい理由**
- `heapq.heappush(heap, element)`のように配列自体を引数に書く必要がある
- 最大ヒープがサポートされていない。要素に`-1`を掛けて、使うときに戻す、という運用ではバグを生む可能性が高い。

C++を使っていればこのような悩みは無いわけですが、Pythonを使っているからと言ってこのような悩みを抱えたままで良いはずがありません。

そこで僕は **使いやすくて高速な`priority_queue`** を自作しようと決めました。

## 実装の道のり

### シンプルな実装とheapqとの比較
前提として、Pythonの`heapq`やC++の`priority_queue`の内部は「2分ヒープ (binary-heap)」で実装されています。
それにならって、まずは2分ヒープで実装してみました。

```python
# 最低限の実装 (最小ヒープ)
class priority_queue():
    def __init__(self):
        self.heap = []

    def push(self, x):
        self.heap.append(x)
        self._sift_up(len(self.heap)-1)

    def pop(self):
        if len(self.heap) == 1:
            return self.heap.pop()
        val = self.heap[0]
        self.heap[0] = self.heap.pop()
        self._sift_down(0)
        return val
    
    def _sift_up(self, idx):
        while idx > 0:
            parent = (idx - 1) // 2
            if self.heap[idx] < self.heap[parent]:
                self.heap[idx], self.heap[parent] = self.heap[parent], self.heap[idx]
                idx = parent
            else:
                break

    def _sift_down(self, idx):
        while True:
            left = idx * 2 + 1
            right = idx * 2 + 2
            best = idx
            if left < len(self.heap) and self.heap[left] < self.heap[best]:
                best = left
            if right < len(self.heap) and self.heap[right] < self.heap[best]:
                best = right
            
            if best == idx:
                break

            self.heap[idx], self.heap[best] = self.heap[best], self.heap[idx]
            idx = best
```

とりあえず実装すると、大体こんな感じになりました。
実際はもっと下手な実装だったのですが、長くて読みづらいだけなのである程度ちゃんとした形に直しました。

ひとまずここで`heapq`と速さ比べをします。この時点で遅ければ自力実装する意味が全く無くなるので、大人しくラッパーを作って終わりになります。

**レギュレーション:**
- AtCoderで使うことが目的なので、テストもAtCoder上で行う。
- 使うコンパイラはCPythonとPyPy。Codonは`heapq`に対応していないため今回は無視。
- `push`と`pop`のランダム実行の速さを比較する(`push`と`pop`が最もよく使われるメソッドであるため)。
- 計測は3回行う。
- 操作回数は$N=2\times 10^5$と$N=2\times 10^6$で行う。前者はAtCoderでよくある制約、後者は実行時間の差を明確にするため(CPythonで実行が終わるギリギリ)。

**テストコード：**
```python
# テストコード
import time
import random
import heapq
##########################
#  ここに自作クラスを貼る  #
##########################
def test(N):
    random.seed(42) # 固定シード
    ops = []
    vals = [random.randint(0, 100000) for i in range(N)]
    size = 0
    for i in range(N):
        # push = 0, pop = 1
        # push : pop = 6 : 4
        # 空でのpopを防ぐため、空でpopが出た場合はpushにする
        if random.random() < 0.6:
            ops.append(0)
            size += 1
        else:
            if size>0:
                ops.append(1)
                size -= 1
            else:
                ops.append(0)
                size += 1

    heap = []
    start = time.perf_counter()
    for i in range(N):
        if ops[i] == 0:
            heapq.heappush(heap, vals[i])
        else:
            heapq.heappop(heap)
    end = time.perf_counter()
    print(f"heapq: {(end-start):.4f}s", end=", ")

    pq = priority_queue()
    start = time.perf_counter()
    for i in range(N):
        if ops[i] == 0:
            pq.push(vals[i])
        else:
            pq.pop()
    end = time.perf_counter()
    print(f"自作:  {(end-start):.4f}s")

if __name__ == "__main__":
    N = 2 * 10**5
    print(f"N={N}", end="  ")
    test(N)

    N = 2 * 10**6
    print(f"N={N}", end=" ")
    test(N)
```
**実行結果１：**
```
1回目
CPython:
N=200000  heapq: 0.0304s, 自作:  0.3218s
N=2000000 heapq: 0.3732s, 自作:  4.0104s
PyPy:
N=200000  heapq: 0.0429s, 自作:  0.0407s
N=2000000 heapq: 0.2081s, 自作:  0.2135s

2回目
CPython:
N=200000  heapq: 0.0339s, 自作:  0.3612s
N=2000000 heapq: 0.4171s, 自作:  4.5210s
PyPy:
N=200000  heapq: 0.0443s, 自作:  0.0422s
N=2000000 heapq: 0.2130s, 自作:  0.2357s

3回目
CPython:
N=200000  heapq: 0.0359s, 自作:  0.3629s
N=2000000 heapq: 0.4346s, 自作:  4.5273s
PyPy:
N=200000  heapq: 0.0479s, 自作:  0.0484s
N=2000000 heapq: 0.2539s, 自作:  0.2717s
```

勝負の結果、CPythonでは全く歯が立たないことが分かり、PyPyだと拮抗する、ということが分かりました。

理由は単純で、CPythonの`heapq`はC言語で実装されていて非常に高速
に動作するからです。CPythonではユーザーのコードがそれと同等に高速に動作することはまずありません。

PyPyではJIT (Just In Time)でのコンパイルが行われるため、繰り返し実行される箇所は高速な機械語に翻訳されますが、PyPyの`heapq`はその仕組みを活用した作りになっており、純粋なPythonでもPyPy用に最適化すれば高速な機械語に変換させることができるため、結果として`heapq`とほぼ同等の高いパフォーマンスが出せます。
しかし「ほぼ同等」ならばやはり`heapq`のラッパーを作るだけと大差ありません。

さて、単純な数値操作の比較だけではいけません。ダイクストラ法のように複数の要素を扱う場合がありますから、タプル操作での比較も必要です。データを`(数値、数値)`にしてみて再計測しました。
```python
vals = [(random.randint(0, 100000), random.randint(0,100000)) for i in range(N)]
```
**実行結果２：**
```
1回目
CPython:
N=200000  heapq: 0.0477s, 自作:  0.3518s
N=2000000 heapq: 0.6183s, 自作:  4.4760s
PyPy:
N=200000  heapq: 0.0555s, 自作:  0.0609s
N=2000000 heapq: 0.3630s, 自作:  0.4457s

2回目
CPython:
N=200000  heapq: 0.0505s, 自作:  0.3878s
N=2000000 heapq: 0.6457s, 自作:  4.8348s
PyPy:
N=200000  heapq: 0.0579s, 自作:  0.0733s
N=2000000 heapq: 0.5291s, 自作:  0.5435s

3回目
CPython:
N=200000  heapq: 0.0489s, 自作:  0.3597s
N=2000000 heapq: 0.6424s, 自作:  4.4861s
PyPy:
N=200000  heapq: 0.0505s, 自作:  0.0536s
N=2000000 heapq: 0.3311s, 自作:  0.4047s
```

ある程度予想できた話ではありますが、やはり勝てません。実行時間の差も先ほどより大きくなっています。CPythonでは8倍程度の差が出ており、改善しても勝機はありません。PyPyはかなり頑張って食らいついていますが、それでもわずかに遅いです。

しかし、ここで注目してほしいのは「`heapq`も遅くなっている」という点です。自作`priority_queue`に比べれば高速に動作しているのは確かなのですが、数値操作時の自作`priority_queue`よりも低速になっていることが分かります。それならば、自作ライブラリの方を数値操作時と同様の速さに改善できれば勝ち目があるかもしれません。

数値単体の操作はもう勝てないので`heapq`に任せて、タプル専門の`priorty_queue`を作っていきましょう。

### 最初のコードの改良
さて、ここからが頑張りどころです。最初のコードを改良していきましょう。CPythonでは`heapq`に勝てないので、PyPy用に直していきます。

<details><summary>最初のコード(再掲)</summary>

```python
# 最低限の実装 (最小ヒープ)
class priority_queue():
    def __init__(self):
        self.heap = []

    def push(self, x):
        self.heap.append(x)
        self._sift_up(len(self.heap)-1)

    def pop(self):
        if len(self.heap) == 1:
            return self.heap.pop()
        val = self.heap[0]
        self.heap[0] = self.heap.pop()
        self._sift_down(0)
        return val
    
    def _sift_up(self, idx):
        while idx > 0:
            parent = (idx - 1) // 2
            if self.heap[idx] < self.heap[parent]:
                self.heap[idx], self.heap[parent] = self.heap[parent], self.heap[idx]
                idx = parent
            else:
                break

    def _sift_down(self, idx):
        while True:
            left = idx * 2 + 1
            right = idx * 2 + 2
            best = idx
            if left < len(self.heap) and self.heap[left] < self.heap[best]:
                best = left
            if right < len(self.heap) and self.heap[right] < self.heap[best]:
                best = right
            
            if best == idx:
                break

            self.heap[idx], self.heap[best] = self.heap[best], self.heap[idx]
            idx = best
```
</details>

先ほど見つかった改善ポイントは「タプル操作を高速化する」ということでした。

ここで行うのが **「優先度とデータの分離」** です。タプルをタプルのまま扱うから遅いのであって、バラバラにしてしまえば良いという考えです。ほとんどの場合は第一要素の「優先度」の部分だけが重要で、第二要素以降は順序がどうなっていても実用上問題ありません。ですから、優先度の比較だけをして、データは優先度配列の要素の移動に連動するだけにすれば、タプルの展開や比較を省略することができるというわけです。

この考えを適用して改善したものが以下です。`heap`は`priority`に改名しました。

```python
class priority_queue():
    def __init__(self):
        self.priority = []
        self.values = []

    def push(self, priority_elm, value_elm):
        self.priority.append(priority_elm)
        self.values.append(value_elm)
        self._sift_up(len(self.priority)-1)

    def pop(self):
        if len(self.priority) == 1:
            return (self.priority.pop(), self.values.pop())
        val = (self.priority[0], self.values[0])
        self.priority[0] = self.priority.pop()
        self.values[0] = self.values.pop()
        self._sift_down(0)
        return val

    def _sift_up(self, idx):
        while idx > 0:
            parent = (idx - 1) // 2 
            if self.priority[idx] < self.priority[parent]:
                self.priority[idx], self.priority[parent] = self.priority[parent], self.priority[idx]
                self.values[idx], self.values[parent] = self.values[parent], self.values[idx]
                idx = parent
            else:
                break

    def _sift_down(self, idx):
        while True:
            left  = idx * 2 + 1
            right = idx * 2 + 2
            best  = idx

            if right < len(self.priority) and self.priority[right] < self.priority[best]:
                best = right
            if left < len(self.priority) and self.priority[left] < self.priority[best]:
                best = left
            if best == idx:
                break

            self.priority[idx], self.priority[best] = self.priority[best], self.priority[idx]
            self.values[idx], self.values[best] = self.values[best], self.values[idx]
            idx = best
```

`priority_queue`で順位を決める要素である`priority`配列と、その他の値を入れる`values`配列に分けました。`sift_up`や`sift_down`では`priority`のみを比較することで単純な数値比較となり、タプル展開のオーバーヘッドや全要素比較の時間を改善しています。また、入力がタプルのままだと結局展開に時間を取られてしまうので、入力を`priority_elm`と`value_elm`に分けています。`value_elm`の方はタプルになっていても問題ありません。

ではここでもう一度勝負させてみましょう。これだけでもかなり改善するはずです。テストコードは先ほどと同じで、入力形式だけ引数の形式に合わせています。PyPyのみでの比較です。

```python
pq.push(values[i][0], values[i][1]) # 入力形式を合わせる
```

**実行結果３：**
```
1回目
N=200000  heapq: 0.0483s, 自作:  0.0457s
N=2000000 heapq: 0.3163s, 自作:  0.2572s

2回目
N=200000  heapq: 0.0495s, 自作:  0.0467s
N=2000000 heapq: 0.3266s, 自作:  0.2669s

3回目
N=200000  heapq: 0.0557s, 自作:  0.0542s
N=2000000 heapq: 0.3634s, 自作:  0.2988s
```

**勝ちました**

$N=2\times 10^5$ で約 $25\ \mathrm{ms}$、$N=2\times 10^6$ で約 $600\ \mathrm{ms}$ 速いです。

要素を更にもうひとつ増やして比較してみましょう。
```python
# 要素を3つに増やす
ri = random.randint
vals = [(ri(0, 100000), ri(0,100000), ri(0, 100000)) for i in range(N)]
# pushの第2引数を単体値 vals[i][1] から スライス vals[i][1:] へ
pq.push(vals[i][0], vals[i][1:])
```
**実行結果４：**
```
1回目
N=200000  heapq: 0.2004s, 自作:  0.0616s
N=2000000 heapq: 1.3940s, 自作:  0.4282s

2回目
N=200000  heapq: 0.1228s, 自作:  0.0563s
N=2000000 heapq: 1.2383s, 自作:  0.3970s

3回目
N=200000  heapq: 0.1371s, 自作:  0.0607s
N=2000000 heapq: 1.3748s, 自作:  0.4435s
```

**勝ちました**

圧勝ですね。タプル操作の重さが`heapq`の実行時間に表れています。それに比べて自作の方はタプル比較をしていないのでパフォーマンスの悪化が抑制されています。$N=2\times 10^5$ で $2～3$ 倍、$N=2\times 10^6$ で 約 $3$ 倍の差が出ています。

### さらなる最適化

さて、本命のタプル対策が済んだところで、細かい最適化をしていきましょう。余計な計算や代入、関数呼び出しを減らすことで極限まで高速にしていきます。

まず気になるのがスワップ操作です。

```python
# sift_up
self.priority[idx], self.priority[parent] = self.priority[parent], self.priority[idx]
# sift_down
self.priority[idx], self.priority[best] = self.priority[best], self.priority[idx]    
```
のような操作がありますが、結局は`self.priority[idx]`があるべき場所にたどり着けば良いだけなので、`self.priority[idx]`を別の変数に保持しておけば途中のスワップは`parent -> idx`や`best -> idx`の操作のみで良いです。`idx`の要素が移動して空いたところを詰めていくイメージです。

直すと以下のようになります。
```python
    def _sift_up(self, idx):
        target_p = self.priority[idx]
        target_v = self.values[idx]
        while idx > 0:
            parent = (idx - 1) // 2 
            if self.priority[idx] < self.priority[parent]:
                self.priority[idx] = self.priority[parent]
                self.values[idx] = self.values[parent]
                idx = parent
            else:
                break
        self.priority[idx] = target_p
        self.values[idx] = target_v

    def _sift_down(self, idx):
        target_p = self.priority[idx]
        target_v = self.values[idx]
        while True:
            left  = idx * 2 + 1
            right = idx * 2 + 2
            best  = idx

            if right < len(self.priority) and self.priority[right] < self.priority[best]:
                best = right
            if left < len(self.priority) and self.priority[left] < self.priority[best]:
                best = left
            if best == idx:
                break

            self.priority[idx] = self.priority[best]
            self.values[idx] = self.values[best]
            idx = best
        self.priority[idx] = target_p
        self.values[idx] = target_v
```

また、`self.priority`のようにドット演算子を使ったアクセスは、`self`のポインタを見つけてからそのメンバの`priority`を探しに行くというステップを踏むため僅かに遅いです。そのため、繰り返し使う場合はローカル変数に束縛しておくと速いです。配列アクセスや関数呼び出しもオーバーヘッドが大きいので繰り返しを避けます。

※ `_sift_up`や`_sift_down`自体はむしろ関数のまま使う方が高速になることが検証で分かったので最後まで残します。

```python
    def push(self, priority_elm, value_elm):
        self.priority.append(priority_elm)
        self.values.append(value_elm)
        self._sift_up(len(self.priority)-1)

    def pop(self):
        if len(self.priority) == 1:
            return (self.priority.pop(), self.values.pop())
        priority = self.priority # ローカル変数に束縛
        values = self.values     # ローカル変数に束縛
        val = (priority[0], values[0])
        priority[0] = priority.pop()
        values[0] = values.pop()
        self._sift_down(0)
        return val

    def _sift_up(self, idx):
        priority = self.priority # ローカル変数に束縛
        values = self.values     # ローカル変数に束縛
        target_p = priority[idx]
        target_v = values[idx]
        while idx > 0:
            parent = (idx - 1) // 2 
            if priority[idx] < priority[parent]:
                priority[idx] = priority[parent]
                values[idx] = values[parent]
                idx = parent
            else:
                break
        priority[idx] = target_p
        values[idx] = target_v

    def _sift_down(self, idx):
        priority = self.priority # ローカル変数に束縛
        values = self.values     # ローカル変数に束縛
        size = len(priority)     # 先に計算しておく
        target_p = priority[idx]
        target_v = values[idx]
        while True:
            left  = idx * 2 + 1
            right = idx * 2 + 2
            best  = idx
            best_p = target_p

            if right < size and priority[right] < best_p:
                best = right
                best_p = priority[right]
            if left < size and priority[left] < best_p:
                best = left
                # best_p = priority[left] は要らない
            if best == idx:
                break

            priority[idx] = priority[best]
            values[idx] = values[best]
            idx = best
        priority[idx] = target_p
        values[idx] = target_v
```

だいぶキレイになってきましたが、まだ速くできます。`append`は$O(1)$ですが、たまにメモリ領域の拡張が行われるので実際には**平均で**$O(1)$です。これを本当の$O(1)$にするため、必要なメモリ領域を事前に確保するようにします。領域が足りなくなっても良いように自動拡張機能も付けておきます。これによって、雑な初期化をしても`RE`にならないようにしてくれます。

この変更により`append`と`pop`はすべて消え、要素の追加/削除が単なる代入と足し算/引き算になります。

`priority`は数値しか入らないので適当な数値で初期化し、`values`はどんな型のデータが来ても良いように`None`で初期化します。これに関してはGeminiの入れ知恵なので要検証なのですが、初期値の型に合わせてPyPyが良い感じにメモリを確保してくれるらしく、実際のデータの型と初期化時の型が一致すると高速に処理できるらしいです。

```python
class priority_queue():
    def __init__(self, capacity=8192):
        self.priority = [-1] * capacity
        self.values = [None] * capacity
        self.size = 0            # 論理的な配列サイズ
        self.capacity = capacity # 実際に確保する配列サイズ

    def push(self, priority_elm, value_elm):
        size = self.size
        if size >= self.capacity:
            self.priority.extend([-1]*self.capacity)
            self.values.extend([None]*self.capacity)
            self.capacity *= 2
        self.priority[size] = priority_elm
        self.values[size] = value_elm
        self._sift_up(size)
        self.size += 1

    def pop(self):
        if self.size == 0:
            return None   # 念のためNoneを返す
        self.size -= 1
        size = self.size
        priority = self.priority
        values = self.values

        val = (priority[0], values[0])
        priority[0] = priority[size]
        values[0] = values[size]
        self._sift_down(0)
        return val

    def _sift_up(self, idx):
        priority = self.priority
        values = self.values
        target_p = priority[idx]
        target_v = values[idx]
        while idx > 0:
            parent = (idx - 1) // 2 
            if priority[idx] < priority[parent]:
                priority[idx] = priority[parent]
                values[idx] = values[parent]
                idx = parent
            else:
                break
        priority[idx] = target_p
        values[idx] = target_v

    def _sift_down(self, idx):
        priority = self.priority
        values = self.values
        size = self.size      # 事前計算の必要が無くなったのでローカル変数に束縛
        target_p = priority[idx]
        target_v = values[idx]
        while True:
            left  = idx * 2 + 1
            right = idx * 2 + 2
            best  = idx
            best_p = target_p

            if right < size and priority[right] < best_p:
                best = right
                best_p = priority[right]
            if left < size and priority[left] < best_p:
                best = left

            if best == idx:
                break

            priority[idx] = priority[best]
            values[idx] = values[best]
            idx = best
        priority[idx] = target_p
        values[idx] = target_v
```

最後に、乗算や除算はハードウェア的には遅いので、可能な限りシフト演算に置き換えます。

また、クラスのメンバは内部的に辞書で管理されており、アクセスするたびにハッシュ計算が走るのでやや遅いです。`__slots__`に変数の配列を与えることで、その配列に無い変数は使わないとコンパイラが解釈し、メンバが配列のように連続した領域に配置されるので高速化できます。

```python
class priority_queue():
    __slots__ = ["priority", "values", "size", "capacity"]

    def __init__(self, capacity=8192): #適当な初期値を与えておく
        self.priority = [-1] * capacity
        self.values = [None] * capacity
        self.size = 0            # 論理的な配列サイズ
        self.capacity = capacity # 実際に確保する配列サイズ

    def push(self, priority_elm, value_elm):
        size = self.size
        if size >= self.capacity:
            self.priority.extend([-1]*self.capacity)
            self.values.extend([None]*self.capacity)
            self.capacity <<= 1
        self.priority[size] = priority_elm
        self.values[size] = value_elm
        self._sift_up(size)
        self.size += 1

    def pop(self):
        if self.size == 0:
            return None   # 念のためNoneを返す
        self.size -= 1
        size = self.size
        priority = self.priority
        values = self.values

        val = (priority[0], values[0])
        priority[0] = priority[size]
        values[0] = values[size]
        self._sift_down(0)
        return val

    def _sift_up(self, idx):
        priority = self.priority
        values = self.values
        target_p = priority[idx]
        target_v = values[idx]
        while idx > 0:
            parent = (idx - 1) >> 1 
            if priority[idx] < priority[parent]:
                priority[idx] = priority[parent]
                values[idx] = values[parent]
                idx = parent
            else:
                break
        priority[idx] = target_p
        values[idx] = target_v

    def _sift_down(self, idx):
        priority = self.priority
        values = self.values
        size = self.size      # 事前計算の必要が無くなったのでローカル変数に束縛
        target_p = priority[idx]
        target_v = values[idx]
        while True:
            left  = (idx << 1) + 1
            right = left + 1 # (idx << 1) + 2 にせず、leftの計算結果を活用
            best  = idx
            best_p = target_p

            if right < size and priority[right] < best_p:
                best = right
                bset_p = priority[right]
            if left < size and priority[left] < best_p:
                best = left

            if best == idx:
                break

            priority[idx] = priority[best]
            values[idx] = values[best]
            idx = best
        priority[idx] = target_p
        values[idx] = target_v
```

これで、タプル操作でも`heapq`より高速に動く`priority_queue`が完成しました！

最後に実測してみましょう。値が2つの場合と3つの場合でそれぞれ比較します。

**実行結果５(値が2つ)：**
```
1回目
N=200000  heapq: 0.0524s, 自作:  0.0357s
N=2000000 heapq: 0.3501s, 自作:  0.1344s

2回目
N=200000  heapq: 0.0541s, 自作:  0.0402s
N=2000000 heapq: 0.3639s, 自作:  0.1292s

3回目
N=200000  heapq: 0.0520s, 自作:  0.0366s
N=2000000 heapq: 0.3185s, 自作:  0.1187s
```
**実行結果６(値が3つ)：**
```
1回目
N=200000  heapq: 0.1382s, 自作:  0.0396s
N=2000000 heapq: 1.4013s, 自作:  0.1274s

2回目
N=200000  heapq: 0.1370s, 自作:  0.0390s
N=2000000 heapq: 1.3555s, 自作:  0.1117s

3回目
N=200000  heapq: 0.1277s, 自作:  0.0364s
N=2000000 heapq: 1.2919s, 自作:  0.1202s
```

見事に高速化できています。最適化前の`priorty_queue`と比較しても、約 $2～3$ 倍の速さを実現できていますし、要素が増えても全く遅くなっていません。

`heapq`と比較しても、$N=2\times 10^5$ の時点で $0.1\ \mathrm{s}$ の差が出ていますし、$N=2\times 10^6$ では $1.0\ \mathrm{s}$ 以上の差が出ています。

## まとめ

他にも同様に最大ヒープ用のクラスを作り、単一値は`heapq`の方が速いので単純なラッパークラスを作ることで使い心地を統一しました。

さらに`heapq`に標準で備わっている他の関数を足し、初期配列を与えた初期化、型変換、要素の参照などにも対応させて、これらを追加実装してクラスを整理しました。

また、「`append`は遅い」みたいなことを言ったのですが実際はそこまで悪くないので、`capacity`を指定しない場合の選択肢として`append/pop`版も作りました。

こうして、使いづらい`heapq`とはおさらばすることができ、高速化もできて満足しました。

[記事の末尾](#完成したライブラリ)にコード全文と初期化関数(+使用例)を添えたので、使いたい方はご自由にコピペしてください。初期化関数を使った初期化はクセがありますが、使いたい条件に合わせて最適なクラスが自動で選択されるような仕組みになっています。好みに合わせてスニペットを用意すると良いと思います。

本編はこれで以上です。
最後まで読んでいただきありがとうございました。 

<br>

最終的にはボツになったものの様々実験して得られた結果があるので、番外編として最後に紹介します(当時のコードを消しちゃったので実測値はありません)。

## その他の取り組みとその結果
1. **4分ヒープにする**

    計算時間の差が大きく表れるのは比較や代入が大量に発生する`sift_up/sift_down`の操作です。前者は`push`時に呼ばれ、後者は`pop`時に呼ばれるため、`push`と`pop`の計算量と読み替えることができます。

    **sift_up**:\
    2分ヒープでは、親との比較/スワップが木の高さ分あるので、要素数$N$に対して **$\log_2 N$** 回の操作が行われます。\
    4分ヒープでは、2分ヒープと比べて木の高さが半分になり、親の数は変わらないので **$\log_4 N$** 回の操作が行われます。

    **sift_down**:
    2分ヒープでは、子2つとの比較/スワップが木の高さ分あるので、要素数$N$に対して **$2\log_2 N$** 回の操作が行われます。\
    4分ヒープでは、子4つとの比較/スワップが木の高さ分あるので、要素数$N$に対して **$4\log_4 N = 2\log_2 N$** 回の操作が行われます。

    したがって、2分ヒープに比べて4分ヒープの方が`push`にかかる時間が半分になり、`pop`は2分ヒープと同等なので、**理論上はこちらの方が高速**です。ハードウェアとの相性を考えても、`sift_down`で必要になる子のデータ4つくらいならキャッシュミスのリスクはそこまで増えませんし、`push`と`pop`は高々同数しか呼び出されません。4は2の冪数なので、親や子のインデックスを求める際にシフト演算も使えます。しかしながら、実測してみると2分ヒープよりも遅かったのでボツになりました。if文の投機ミスなどで遅くなるリスクを減らすために番兵を置いてみたのですが、これもダメでした。

2. `_sift_up`や`_sift_down`の完全インライン化

    `_sift_up`や`_sift_down`などのヘルパー関数を使うと、可読性とのトレードオフで関数呼び出しのオーバーヘッドが累積して遅くなりそうだと思っていたのですが、全てのヘルパーをベタ書きに直して実行してみたら却って遅くなってしまいました。おそらく、関数のまとまりとして実行された方が再利用箇所の検知がしやすいのだと思われます。`append/pop`版がそこまで遅くないのもこれが理由だと思われます。

**試していないこと**
- 3分ヒープ版`priority_queue`

    $d$ 分ヒープは $d$ がネイピア数 $e\approx 2.718...$ に近いほど計算回数が減るので、$d=3$ が理論上は最速だが、ビット演算と相性が悪いので`push_up`での除算が重く、2分ヒープを超えるのは難しそう。キャッシュヒット率は悪くないと思うので、もしかしたら速いかもしれない。


## 完成したライブラリ

1. PyPyで使ってください。CPythonで使う場合は`heapq`一択なので、コード上部にある`heapq`のラッパークラス群(`XXX_heap_queue`全て)をご利用ください。必要に応じて初期化用関数を作ると良いと思います(コード末尾を参照)。

2. 関数の引数や返り値は基本的に全て統一されています。`values`配列が必要になるような複数値を扱う場合に限り、`push`系関数の引数は`(優先度, その他の値)`の2つが、`pop`系関数の返り値は`(優先度, その他の値)`のタプルが返ることに注意してください。

3. 競プロで使うなら`capacity = N`や`capacity = N + M`のような設定で使うのがオススメです。

```python
import heapq
class base_heap_queue():

    def __bool__(self):
        return len(self.heap) > 0
    
    def __len__(self):
        return len(self.heap)
    
    def empty(self):
        return len(self.heap) == 0
    
    def nlargest(self, n):
        return heapq.nlargest(n, self)

    def nsmallest(self, n):
        return heapq.nsmallest(n, self)

class min_heap_queue(base_heap_queue):
    def __init__(self, iterable=None):
        if iterable is None:
            self.heap = []
        else:
            self.heap = list(iterable)
            heapq.heapify(self.heap)

    def __getitem__(self, idx):
        return self.heap[idx]
    
    def __iter__(self):
        return iter(self.heap)

    def push(self, x):
        heapq.heappush(self.heap, x)

    def pop(self):
        return heapq.heappop(self.heap)

    def pushpop(self, x):
        return heapq.heappushpop(self.heap, x)
    
    def replace(self, x):
        return heapq.heapreplace(self.heap, x)

class max_heap_queue(base_heap_queue):
    # _invert関数が挟まるのでやや遅いが、競技の範囲内では誤差程度
    def __init__(self, iterable=None):
        self.heap = []
        if iterable is not None:
            self.heap = [self._invert(e) for e in iterable]
            heapq.heapify(self.heap)

    def __getitem__(self, idx):
        return self._invert(self.heap[idx])

    def __iter__(self):
        return iter(map(self._invert, self.heap))
    
    def _invert(self, x):
        if type(x) is tuple:
            return (-x[0], *x[1:])
        return -x

    def push(self, x):
        heapq.heappush(self.heap, self._invert(x))

    def pop(self):
        return self._invert(heapq.heappop(self.heap))

    def pushpop(self, x):
        return self._invert(heapq.heappushpop(self.heap, self._invert(x)))
    
    def replace(self, x):
        return self._invert(heapq.heapreplace(self.heap, self._invert(x)))

class Base_PQ():
    __slots__ = ['priority', 'values']

    def __getitem__(self, idx):
        return (self.priority[idx], self.values[idx])

    def __setitem__(self, key, value):
        self
        
    def top(self):
        if len(self) > 0:
            return (self.priority[0], self.values[0])
        return None

    def print_subtree(self, idx, end='\n') -> None:
        if idx >= len(self):
            print('.', end='')
            return
        print(self[idx], end='')
        print('(', end='')
        self.print_subtree((idx<<1)+1, '')
        print(',', end='')
        self.print_subtree((idx<<1)+2, '')
        print(')', end=end)

    def print_tree(self) -> None:
        self.print_subtree(0)

    def nlargest(self, n):
        n = min(n, len(self))
        if n == 0:
            return []
        res = heapq.nlargest(n, ((self.priority[i], i) for i in range(len(self))))
        return [(p, self.values[i]) for p, i in res]

    def nsmallest(self, n):
        n = min(n, len(self))
        if n == 0:
            return []
        res = heapq.nsmallest(n, ((self.priority[i], i) for i in range(len(self))))
        return [(p, self.values[i]) for p, i in res]

class Base_DPQ(Base_PQ):
    __slots__ = ()

    def __init__(self, iterable=None):
        '''
        iterable: listやsetなどを与えるとヒープ配列に変換される
        is_pair : ペア型を使う。第一要素がヒープの比較対象、第二要素が比較対象外の値として扱われる
        '''        
        self.priority = []
        self.values = []
        if iterable is not None:
            for p, v in iterable:
                self.priority.append(p)
                self.values.append(v)
            self._heapify()

    def __bool__(self):
        return len(self.priority) > 0

    def __iter__(self):
        return iter(zip(self.priority, self.values))
    
    def __len__(self):
        return len(self.priority)
    
    def __str__(self):
        return str(list(zip(self.priority, self.values)))
    
    def _heapify(self):
        for i in reversed(range(len(self.priority)>>1)):
            self._sift_down(i)
    
    def empty(self):
        return len(self.priority)==0

    def push(self, priority_elm, value_elm) -> None:
        self.values.append(value_elm)
        self.priority.append(priority_elm)
        self._sift_up(len(self.priority)-1)

    def pop(self) -> None:
        if len(self.priority) == 0:
            return None
        priority = self.priority 
        values = self.values
        if len(priority) == 1:
            return (priority.pop(), values.pop())
        val = (priority[0], values[0])
        priority[0] = priority.pop()
        values[0] = values.pop()
        self._sift_down(0)
        return val

    def replace(self, priority_elm, value_elm):
        '''トップを取り出して新しい要素を入れ、ヒープを再構築する'''
        priority = self.priority
        values = self.values
        if len(priority) == 0:
            priority.append(priority_elm)
            values.append(value_elm)
            return None
        res = (priority[0], values[0])
        priority[0] = priority_elm
        values[0] = value_elm
        self._sift_down(0)        
        return res

class Base_FPQ(Base_PQ):
    __slots__ = ['size','capacity']
    def __init__(self, iterable=None, capacity=8192):
        '''
        iterable: listやsetなどを与えるとヒープ配列に変換される
        is_pair : ペア型を使う。第一要素がヒープの比較対象、第二要素が比較対象外の値として扱われる
        capacity: 初期化時に確保するメモリ領域の大きさ
        '''
        self.priority = [-1] * capacity
        self.values = [None] * capacity
        self.size = 0
        self.capacity = capacity

        if iterable is not None:
            priority = self.priority
            values = self.values
            for e, v in iterable:
                if self.size >= self.capacity:
                    priority.extend([-1]*self.capacity)
                    values.extend([None]*self.capacity)
                    self.capacity <<= 1
                priority[self.size] = e
                values[self.size] = v
                self.size += 1
            self._heapify()

    def __bool__(self):
        return self.size > 0

    def __iter__(self):
        return iter(zip(self.priority[:self.size], self.values[:self.size]))
    
    def __len__(self):
        return self.size
    
    def __str__(self):
        return str(list(zip(self.priority[:self.size], self.values[:self.size])))

    def _heapify(self):
        for i in reversed(range(self.size>>1)):
            self._sift_down(i)

    def empty(self):
        return self.size==0

    def push(self, priority_elm, value_elm) -> None:
        n = self.size
        if n >= self.capacity:
            self.priority.extend([-1]*self.capacity)
            self.values.extend([None]*self.capacity)
            self.capacity <<= 1
        self.priority[n] = priority_elm
        self.values[n] = value_elm
        self._sift_up(n)
        self.size += 1

    def pop(self):
        if self.size == 0:
            return None
        self.size -= 1
        size = self.size
        priority = self.priority
        values = self.values
        
        val = (priority[0], values[0])
        priority[0] = priority[size]
        values[0] = values[size]
        self._sift_down(0)        
        return val

    def replace(self, priority_elm, value_elm):
        '''トップを取り出して新しい要素を入れ、ヒープを再構築する'''
        priority = self.priority
        values = self.values
        if self.size == 0:
            priority[0] = priority_elm
            values[0] = value_elm
            self.size += 1
            return None
        res = (priority[0], values[0])
        priority[0] = priority_elm
        values[0] = value_elm
        self._sift_down(0)
        return res

class Max_Dynamic_Priority_Queue(Base_DPQ):
    '''
    優先度付きキュー
    必要に応じて動的にメモリを確保する
    '''
    __slots__ = ()

    def _sift_up(self, idx) -> None:
        priority = self.priority
        values = self.values
        target_p = priority[idx]
        target_v = values[idx]
        while idx > 0:
            parent = (idx - 1) >> 1 
            if target_p > priority[parent]:
                priority[idx] = priority[parent]
                values[idx] = values[parent]
                idx = parent
            else:
                break
        priority[idx] = target_p
        values[idx] = target_v

    def _sift_down(self, idx) -> None:
        n = len(self.priority)
        priority = self.priority
        values = self.values
        target_p = priority[idx]
        target_v = values[idx]
        while True:
            left  = (idx << 1) + 1
            right = left + 1
            best  = idx
            best_p = target_p

            if right < n and priority[right] > best_p:
                best = right
                best_p = priority[right]
            if left < n and priority[left] > best_p:
                best = left
                # best_p = priority[left]
            if best == idx:
                break

            priority[idx] = priority[best]
            values[idx] = values[best]
            idx = best
        priority[idx] = target_p
        values[idx] = target_v

    def pushpop(self, priority_elm, value_elm):
        '''新しい要素を入れてから、トップを取り出す'''
        priority = self.priority
        values = self.values
        if len(priority) > 0 and priority[0] > priority_elm:
            priority_elm, value_elm, priority[0], values[0] = priority[0], values[0], priority_elm, value_elm
            self._sift_down(0)
        return (priority_elm, value_elm)

class Min_Dynamic_Priority_Queue(Base_DPQ):
    '''
    優先度付きキュー
    必要に応じて動的にメモリを確保する
    '''
    __slots__ = ()

    def _sift_up(self, idx) -> None:
        priority = self.priority
        values = self.values
        target_p = priority[idx]
        target_v = values[idx]
        while idx > 0:
            parent = (idx - 1) >> 1 
            if target_p < priority[parent]:
                priority[idx] = priority[parent]
                values[idx] = values[parent]
                idx = parent
            else:
                break
        priority[idx] = target_p
        values[idx] = target_v

    def _sift_down(self, idx) -> None:
        n = len(self.priority)
        priority = self.priority
        values = self.values
        target_p = priority[idx]
        target_v = values[idx]
        while True:
            left  = (idx << 1) + 1
            right = left + 1
            best  = idx
            best_p = target_p

            if right < n and priority[right] < best_p:
                best = right
                best_p = priority[right]
            if left < n and priority[left] < best_p:
                best = left
                # best_p = priority[left]
            if best == idx:
                break

            priority[idx] = priority[best]
            values[idx] = values[best]
            idx = best
        priority[idx] = target_p
        values[idx] = target_v

    def pushpop(self, priority_elm, value_elm):
        '''新しい要素を入れてから、トップを取り出す'''
        priority = self.priority
        values = self.values
        if len(priority) > 0 and priority[0] < priority_elm:
            priority_elm, value_elm, priority[0], values[0] = priority[0], values[0], priority_elm, value_elm
            self._sift_down(0)
        return (priority_elm, value_elm)

class Max_Fixed_Priority_Queue(Base_FPQ):
    '''
    固定長の優先度付きキュー(最大ヒープ)
    初期化時にcapacityの分だけ静的にメモリを確保し、その中で操作を行う
    メモリ領域が足りなくなったら自動で拡張する
    '''
    __slots__ = ()
    
    def _sift_up(self, idx) -> None:
        priority = self.priority
        values = self.values
        target_p = priority[idx]
        target_v = values[idx]
        while idx > 0:
            parent = (idx - 1) >> 1 
            if target_p > priority[parent]:
                priority[idx] = priority[parent]
                values[idx] = values[parent]
                idx = parent
            else:
                break
        priority[idx] = target_p
        values[idx] = target_v

    def _sift_down(self, idx) -> None:
        n = self.size
        priority = self.priority
        values = self.values
        target_p = priority[idx]
        target_v = values[idx]
        while True:
            left  = (idx << 1) + 1
            right = left + 1
            best  = idx
            best_p = target_p

            if right < n and priority[right] > best_p:
                best = right
                best_p = priority[right]
            if left < n and priority[left] > best_p:
                best = left
                # best_p = priority[left]
            if best == idx:
                break

            priority[idx] = priority[best]
            values[idx] = values[best]
            idx = best
        priority[idx] = target_p
        values[idx] = target_v

    def pushpop(self, priority_elm, value_elm):
        '''新しい要素を入れてから、トップを取り出す'''
        priority = self.priority
        values = self.values
        if self.size > 0 and priority[0] > priority_elm:
            priority_elm, value_elm, priority[0], values[0] = priority[0], values[0], priority_elm, value_elm
            self._sift_down(0)
        return (priority_elm, value_elm)

class Min_Fixed_Priority_Queue(Base_FPQ):
    '''
    固定長の優先度付きキュー(最小ヒープ)
    初期化時にcapacityの分だけ静的にメモリを確保し、その中で操作を行う
    メモリ領域が足りなくなったら自動で拡張する
    '''

    __slots__ = ()
    
    def _sift_up(self, idx) -> None:
        priority = self.priority
        values = self.values
        target_p = priority[idx]
        target_v = values[idx]
        while idx > 0:
            parent = (idx - 1) >> 1 
            if target_p < priority[parent]:
                priority[idx] = priority[parent]
                values[idx] = values[parent]
                idx = parent
            else:
                break
        priority[idx] = target_p
        values[idx] = target_v

    def _sift_down(self, idx) -> None:
        n = self.size
        priority = self.priority
        values = self.values
        target_p = priority[idx]
        target_v = values[idx]
        while True:
            left  = (idx << 1) + 1
            right = left + 1
            best  = idx
            best_p = target_p

            if right < n and priority[right] < best_p:
                best = right
                best_p = priority[right]
            if left < n and priority[left] < best_p:
                best = left
                # best_p = priority[left]
            if best == idx:
                break

            priority[idx] = priority[best]
            values[idx] = values[best]
            idx = best
        priority[idx] = target_p
        values[idx] = target_v

    def pushpop(self, priority_elm, value_elm):
        '''新しい要素を入れてから、トップを取り出す'''
        priority = self.priority
        values = self.values
        if self.size > 0 and priority[0] < priority_elm:
            priority_elm, value_elm, priority[0], values[0] = priority[0], values[0], priority_elm, value_elm
            self._sift_down(0)
        return (priority_elm, value_elm)

def priority_queue(
        iterable = None,
        max_heap: bool = False,
        is_pair: bool = False,
        capacity: int = None
        ) -> Max_Fixed_Priority_Queue | Min_Fixed_Priority_Queue | Max_Dynamic_Priority_Queue | Min_Dynamic_Priority_Queue | max_heap_queue | min_heap_queue:
    '''
    priority queueを取得するファクトリ関数

    iterable: 初期要素のコンテナ
    max_heap: True = 最大ヒープ | False = 最小ヒープ
    is_pair : True = 第一要素のみをヒープに入れて、第二要素を専用配列に分ける | False = ヒープに全てのデータを入れる
    capacity: 指定するとFixed Priority Queueを、指定しないとDynamic Priority Queueを得る
    '''
    if is_pair:
        if capacity is None:
            if max_heap:
                return Max_Dynamic_Priority_Queue(iterable=iterable)
            else:
                return Min_Dynamic_Priority_Queue(iterable=iterable)
        else:
            if max_heap:
                return Max_Fixed_Priority_Queue(iterable=iterable, capacity=capacity)
            else:
                return Min_Fixed_Priority_Queue(iterable=iterable, capacity=capacity)

    if max_heap:
        return max_heap_queue(iterable=iterable)
    else:
        return min_heap_queue(iterable=iterable)

if __name__ == '__main__':
    primes = [31, 29, 23, 19, 17, 13, 11, 7, 5, 3, 2]
    pq = priority_queue(
        iterable=primes,
        max_heap=False,
        is_pair=False,
        capacity=None
        )
    pq.push(20)
    pq.push(10)
    pq.push(15)
    e = pq.pop() # 2
    print(e) # 2
    print(pq) # 配列を取得できます
    normal_list = list(pq) # 変換できます
```
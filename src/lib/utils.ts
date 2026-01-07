export function isNew(date: Date, days: number = 30): boolean {
  const today = new Date();
  const targetDate = new Date(date);
  
  // ミリ秒単位の差分を計算
  const diffTime = Math.abs(today.getTime() - targetDate.getTime());
  // 日数に変換
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 指定した日数（デフォルト30日）以内ならtrue
  return diffDays <= days;
}
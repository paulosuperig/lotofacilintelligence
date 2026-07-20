export const calculateGameStats = (nums: number[]) => {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
  const moldNumbers = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
  
  const evenCount = nums.filter(n => n % 2 === 0).length;
  const pCount = nums.filter(n => primes.includes(n)).length;
  const moldCount = nums.filter(n => moldNumbers.includes(n)).length;
  const sum = nums.reduce((a, b) => a + b, 0);
  
  const sorted = [...nums].sort((a, b) => a - b);
  let maxSeq = sorted.length > 0 ? 1 : 0;
  let currentSeq = sorted.length > 0 ? 1 : 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      currentSeq++;
      maxSeq = Math.max(maxSeq, currentSeq);
    } else {
      currentSeq = 1;
    }
  }

  return {
    pairs: evenCount,
    odd: nums.length - evenCount,
    primes: pCount,
    sum,
    mold: moldCount,
    sequence: maxSeq
  };
};

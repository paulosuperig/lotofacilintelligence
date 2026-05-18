export const calculateGameStats = (nums: number[]) => {
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
  const moldNumbers = [1, 2, 3, 4, 5, 6, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25];
  
  const evenCount = nums.filter(n => n % 2 === 0).length;
  const pCount = nums.filter(n => primes.includes(n)).length;
  const moldCount = nums.filter(n => moldNumbers.includes(n)).length;
  const sum = nums.reduce((a, b) => a + b, 0);
  
  let maxSeq = 1;
  let currentSeq = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i - 1] + 1) {
      currentSeq++;
      maxSeq = Math.max(maxSeq, currentSeq);
    } else {
      currentSeq = 1;
    }
  }
  
  return {
    pairs: evenCount,
    odd: 15 - evenCount,
    primes: pCount,
    sum,
    mold: moldCount,
    sequence: maxSeq
  };
};

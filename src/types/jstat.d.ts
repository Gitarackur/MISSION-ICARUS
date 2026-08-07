declare module "jstat" {
  export const jStat: {
    mean(values: number[]): number;
    median(values: number[]): number;
    variance(values: number[], sample?: boolean): number;
    stdev(values: number[], sample?: boolean): number;
    corrcoeff(x: number[], y: number[]): number;
    studentt: {
      cdf(value: number, degreesOfFreedom: number): number;
      inv(value: number, degreesOfFreedom: number): number;
    };
    jacobi: (a: number[][]) => [number[][], number[]];
    PCA: (
      x: number[][]
    ) => [number[][], number[], number[][], number[][]];
    centralF: {
      cdf(value: number, df1: number, df2: number): number;
    };
    chisquare: {
      cdf(value: number, degreesOfFreedom: number): number;
    };
  };
}

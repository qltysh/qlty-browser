const reviewPageRegex = /pull\/[0-9]+\/files/;
const commitPageRegex = /commit\/[0-9a-f]{40}/;

export const isReviewPage = (page: string) =>
   reviewPageRegex.test(page);

export const isCommitPage = (page: string) =>
  commitPageRegex.test(page);

export type IsPageFn = (page: string) => boolean;

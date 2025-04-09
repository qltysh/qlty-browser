declare interface GetAuthStateHashRequest {
  command: "getAuthStateHash";
}

declare interface GetAuthStateHashResponse {
  hash: string | null;
}

declare interface SignInRequest {
  command: "signIn";
}

declare interface GetFileCoverageRequest {
  command: "getFileCoverage";
  workspace: string;
  project: string;
  reference: string;
  path: string;
}

declare interface GetFileCoverageResponse {
  files: FileCoverage[];
  tags: string[];
}

declare interface GetFileCoverageError {
  error: string;
}

declare interface FileCoverage {
  path: string;
  hits: number[];
  coveredLines: number;
  missedLines: number;
  omitLines: number;
  totalLines: number;
}


declare type MessageRequest = GetFileCoverageRequest | GetAuthStateHashRequest | SignInRequest;

declare namespace chrome {
  namespace runtime {
    function sendMessage(
      message: GetFileCoverageRequest,
      callback: (response: GetFileCoverageResponse | GetFileCoverageError) => void
    ): void;

    function sendMessage(
      message: GetAuthStateHashRequest,
      callback: (response: GetAuthStateHashResponse) => void
    ): void;

    function sendMessage(
      message: SignInRequest,
      callback: () => void
    ): void;
  }
}

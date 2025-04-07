declare interface FetchCoverageDataRequest {
  command: "getFileCoverage";
  workspace: string;
  project: string;
  reference: string;
  path: string;
}

declare interface CoverageReferenceResponse {
  files: FileCoverage[];
  tags: string[];
}

declare interface CoverageReferenceError {
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

declare type MessageRequest = FetchCoverageDataRequest;

declare namespace chrome {
  namespace runtime {
    function sendMessage(
      message: FetchCoverageDataRequest,
      callback: (response: CoverageReferenceResponse | CoverageReferenceError) => void
    ): void;
  }
}

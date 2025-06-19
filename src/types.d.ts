declare interface StoredSettings {
  apiToken: string;
  customApiToken: string;
  login: string;
  avatarUrl: string;
}

declare interface GetAuthStateHashRequest {
  command: "getAuthStateHash";
}

declare interface GetAuthStateHashResponse {
  hash: string | null;
}

declare interface SignInRequest {
  command: "signIn";
}

declare interface SignOutRequest {
  command: "signOut";
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

declare interface GetUserRequest {
  command: "getUser";
}

declare interface GetUserResponse {
  id: string;
  name: string;
  email: string;
  login: string;
  avatarUrl: string;
}

declare interface EndAuthFlowRequest {
  command: "endAuthFlow";
}

declare type MessageRequest =
  | GetFileCoverageRequest
  | GetAuthStateHashRequest
  | SignInRequest
  | SignOutRequest
  | GetUserRequest
  | EndAuthFlowRequest;

declare namespace chrome {
  namespace runtime {
    function sendMessage(
      message: GetFileCoverageRequest,
      callback: (
        response: GetFileCoverageResponse | GetFileCoverageError
      ) => void
    ): void;

    function sendMessage(
      message: GetAuthStateHashRequest,
      callback: (response: GetAuthStateHashResponse) => void
    ): void;

    function sendMessage(message: SignInRequest, callback: () => void): void;

    function sendMessage(
      message: GetUserRequest,
      callback: (response: GetUserResponse | null) => void
    ): void;

    function sendMessage(
      message: EndAuthFlowRequest,
      callback: () => void
    ): void;
  }
}

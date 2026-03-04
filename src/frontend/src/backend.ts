import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';
import type { HttpAgentOptions } from '@dfinity/agent';
import type { Identity } from '@dfinity/agent';
import { Actor } from '@dfinity/agent';

export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };

export type backendInterface = {
  '_initializeAccessControlWithSecret' : ActorMethod<[string], undefined>;
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>;
  'getAllUserProfiles' : ActorMethod<
    [],
    { 'ok' : Array<[string, string]> } |
      { 'err' : string }
  >;
  'getCallerUserProfile' : ActorMethod<
    [],
    { 'ok' : string } |
      { 'err' : string }
  >;
  'getCallerUserRole' : ActorMethod<[], UserRole>;
  'isCallerAdmin' : ActorMethod<[], boolean>;
  'loadAppState' : ActorMethod<[], { 'ok' : string } | { 'err' : string }>;
  'saveAppState' : ActorMethod<[string], { 'ok' : null } | { 'err' : string }>;
  'saveCallerUserProfile' : ActorMethod<
    [string],
    { 'ok' : null } |
      { 'err' : string }
  >;
};

export type CreateActorOptions = {
  agentOptions?: HttpAgentOptions & { identity?: Identity };
};

export class ExternalBlob {
  private _url?: string;
  private _bytes?: Uint8Array;
  onProgress?: (progress: number) => void;

  constructor(bytes?: Uint8Array) {
    this._bytes = bytes;
  }

  static fromURL(url: string): ExternalBlob {
    const blob = new ExternalBlob();
    blob._url = url;
    return blob;
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    if (this._url) {
      const response = await fetch(this._url);
      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    }
    return new Uint8Array(0);
  }
}

export const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  return IDL.Service({
    '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'getAllUserProfiles' : IDL.Func(
        [],
        [
          IDL.Variant({
            'ok' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
            'err' : IDL.Text,
          }),
        ],
        ['query'],
      ),
    'getCallerUserProfile' : IDL.Func(
        [],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        ['query'],
      ),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'loadAppState' : IDL.Func(
        [],
        [IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text })],
        ['query'],
      ),
    'saveAppState' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text })],
        [],
      ),
    'saveCallerUserProfile' : IDL.Func(
        [IDL.Text],
        [IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text })],
        [],
      ),
  });
};

export const init: (args: { IDL: typeof IDL }) => IDL.Type[] = () => { return []; };

type ActorCreateOptions = CreateActorOptions & {
  agent: import('@dfinity/agent').HttpAgent;
  processError?: (e: unknown) => never;
};

export function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options: ActorCreateOptions,
): backendInterface {
  return Actor.createActor<backendInterface>(idlFactory, {
    canisterId,
    agent: options.agent,
  });
}

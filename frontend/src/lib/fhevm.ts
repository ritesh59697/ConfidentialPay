import { createInstance, initSDK, SepoliaConfig, type FhevmInstance } from "@zama-fhe/relayer-sdk/web";

let instancePromise: Promise<FhevmInstance> | null = null;

type NetworkProvider = Parameters<typeof createInstance>[0]["network"];

// Use proxy in dev to avoid CORS issues
const isDev = import.meta.env.DEV;
const relayerUrl = isDev
  ? `${window.location.origin}/relayer/v2`
  : (import.meta.env.VITE_RELAYER_URL || SepoliaConfig.relayerUrl);

export function getFhevm(): Promise<FhevmInstance> {
  if (!instancePromise) {
    instancePromise = (async () => {
      await initSDK();
      return createInstance({
        ...SepoliaConfig,
        relayerUrl,
        network: (window as unknown as { ethereum: NetworkProvider }).ethereum,
      });
    })();
  }
  return instancePromise;
}

export interface DecryptionSession {
  keypair: { publicKey: string; privateKey: string };
  signature: string;
  contracts: string[];
  startTimestamp: number;
  durationDays: number;
  userAddress: string;
}

const SESSION_KEY_PREFIX = "confidentialpay.decryptSession.v1";
const SESSION_DAYS = 1;
export const MAX_SESSION_CONTRACTS = 10;

export async function getDecryptionSession(
  name: string,
  userAddress: string,
  contracts: string[],
  signTypedData: (args: {
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
  }) => Promise<string>,
): Promise<DecryptionSession> {
  if (contracts.length > MAX_SESSION_CONTRACTS) {
    throw new Error(`session "${name}" exceeds the ${MAX_SESSION_CONTRACTS}-contract limit`);
  }
  const sorted = [...contracts].sort();

  const cached = localStorage.getItem(`${SESSION_KEY_PREFIX}.${name}`);
  if (cached) {
    try {
      const session = JSON.parse(cached) as DecryptionSession;
      const expires = (session.startTimestamp + session.durationDays * 86_400) * 1000;
      const sameUser = session.userAddress.toLowerCase() === userAddress.toLowerCase();
      const coversContracts = sorted.every((c) =>
        session.contracts.map((s) => s.toLowerCase()).includes(c.toLowerCase()),
      );
      if (sameUser && coversContracts && Date.now() < expires - 60_000) return session;
    } catch {
      // fall through to fresh session
    }
  }

  const fhevm = await getFhevm();
  const keypair = fhevm.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const eip712 = fhevm.createEIP712(keypair.publicKey, sorted, startTimestamp, SESSION_DAYS);

  const signature = await signTypedData({
    domain: eip712.domain as unknown as Record<string, unknown>,
    types: { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification } as Record<string, unknown>,
    primaryType: "UserDecryptRequestVerification",
    message: eip712.message as unknown as Record<string, unknown>,
  });

  const session: DecryptionSession = {
    keypair,
    signature,
    contracts: sorted,
    startTimestamp,
    durationDays: SESSION_DAYS,
    userAddress,
  };
  localStorage.setItem(`${SESSION_KEY_PREFIX}.${name}`, JSON.stringify(session));
  return session;
}

export function clearDecryptionSession(name: string) {
  localStorage.removeItem(`${SESSION_KEY_PREFIX}.${name}`);
}

const ZERO_HANDLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

export async function userDecrypt(
  session: DecryptionSession,
  handle: string,
  contractAddress: string,
): Promise<bigint> {
  if (handle === ZERO_HANDLE) return 0n;
  const fhevm = await getFhevm();
  const decrypted = await fhevm.userDecrypt(
    [{ handle, contractAddress }],
    session.keypair.privateKey,
    session.keypair.publicKey,
    session.signature.replace(/^0x/, ""),
    session.contracts,
    session.userAddress,
    session.startTimestamp,
    session.durationDays,
  );
  return BigInt(decrypted[handle as `0x${string}`] as string | bigint);
}

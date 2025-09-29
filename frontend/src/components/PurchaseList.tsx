import { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';

type PurchaseView = {
  index: number;
  timestamp: number;
  itemHandle: string;
  priceHandle: string;
  qtyHandle: string;
  // decrypted values
  itemId?: string;
  price?: string;
  quantity?: string;
};

export function PurchaseList() {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signer = useEthersSigner();
  const [rows, setRows] = useState<PurchaseView[]>([]);
  const [loading, setLoading] = useState(false);
  const [decLoading, setDecLoading] = useState(false);

  const client = useMemo(() => {
    return createPublicClient({ chain: sepolia, transport: http() });
  }, []);

  async function load() {
    if (!address) return;
    if (!CONTRACT_ADDRESS) return;
    setLoading(true);
    try {
      // Read count via viem
      const count = await client.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI as any,
        functionName: 'getPurchaseCount',
        args: [address],
      });

      const total = Number(count as bigint);
      const list: PurchaseView[] = [];
      for (let i = 0; i < total; i++) {
        const res: any = await client.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI as any,
          functionName: 'getPurchaseAt',
          args: [address, BigInt(i)],
        });
        // res = [bytes32, bytes32, bytes32, uint64]
        list.push({
          index: i,
          timestamp: Number(res[3]),
          itemHandle: res[0],
          priceHandle: res[1],
          qtyHandle: res[2],
        });
      }
      setRows(list);
    } finally {
      setLoading(false);
    }
  }

  async function decryptAll() {
    if (!instance || !address || !rows.length) return;
    setDecLoading(true);
    try {
      const keypair = instance.generateKeypair();
      const contractAddresses = [CONTRACT_ADDRESS];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';

      const handles = rows.flatMap((r) => [r.itemHandle, r.priceHandle, r.qtyHandle]);
      const handleContractPairs = handles.map((h) => ({ handle: h, contractAddress: CONTRACT_ADDRESS }));

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays,
      );

      const resolvedSigner = await signer;
      if (!resolvedSigner) throw new Error('Signer not available');

      const signature = await resolvedSigner.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays,
      );

      // Map back
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          itemId: result[r.itemHandle] ?? undefined,
          price: result[r.priceHandle] ?? undefined,
          quantity: result[r.qtyHandle] ?? undefined,
        })),
      );
    } finally {
      setDecLoading(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 className="title">My Purchases</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="button" onClick={load} disabled={!address || loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="button" onClick={decryptAll} disabled={!address || !rows.length || decLoading}>
            {decLoading ? 'Decrypting...' : 'Decrypt All'}
          </button>
        </div>
      </div>

      {!address ? (
        <p className="hint">Connect your wallet to view purchases.</p>
      ) : !rows.length ? (
        <p className="hint">No purchases found. Submit one in the New tab.</p>
      ) : (
        <div className="table">
          <div className="thead">
            <div>#</div>
            <div>Date</div>
            <div>Item</div>
            <div>Price</div>
            <div>Qty</div>
          </div>
          {rows.map((r) => (
            <div className="trow" key={r.index}>
              <div>{r.index + 1}</div>
              <div>{new Date(r.timestamp * 1000).toLocaleString()}</div>
              <div>{r.itemId ?? '***'}</div>
              <div>{r.price ?? '***'}</div>
              <div>{r.quantity ?? '***'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


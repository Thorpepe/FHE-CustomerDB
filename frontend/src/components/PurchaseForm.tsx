import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';

export function PurchaseForm() {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const [customer, setCustomer] = useState<string>('');
  const [itemId, setItemId] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');

    if (!instance) {
      alert('Encryption service not ready');
      return;
    }
    if (!CONTRACT_ADDRESS) {
      alert('Contract address not configured');
      return;
    }
    if (!customer || !itemId || !price || !quantity) {
      alert('Please fill all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const signer = await signerPromise;
      if (!signer) throw new Error('No signer available');

      const clearItemId = parseInt(itemId);
      const clearPrice = parseInt(price);
      const clearQty = parseInt(quantity);

      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address!);
      input.add32(clearItemId);
      input.add32(clearPrice);
      input.add32(clearQty);
      const encrypted = await input.encrypt();

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setStatus('Confirm the transaction in your wallet...');

      const tx = await contract.addPurchase(
        customer,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.handles[2],
        encrypted.inputProof,
      );

      setStatus('Waiting for confirmation...');
      await tx.wait();
      setStatus('Purchase submitted successfully');

      setItemId('');
      setPrice('');
      setQuantity('');
    } catch (e: any) {
      console.error(e);
      setStatus(`Failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2 className="title">Submit Purchase</h2>
      <form onSubmit={onSubmit} className="form">
        <label className="label">Customer Address</label>
        <input
          className="input"
          placeholder="0x..."
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
        />

        <div className="grid">
          <div>
            <label className="label">Item ID</label>
            <input
              className="input"
              type="number"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Price</label>
            <input
              className="input"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Quantity</label>
            <input
              className="input"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>

        <button className="button" disabled={isSubmitting || !instance}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>

        {status && <p className="hint">{status}</p>}
      </form>
    </div>
  );
}


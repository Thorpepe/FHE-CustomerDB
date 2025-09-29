import { useState } from 'react';
import { Header } from './Header';
import { PurchaseForm } from './PurchaseForm';
import { PurchaseList } from './PurchaseList';
import '../styles/Purchases.css';

export function PurchaseApp() {
  const [activeTab, setActiveTab] = useState<'new' | 'my'>('new');

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="tabs">
          <nav className="tab-nav">
            <button
              onClick={() => setActiveTab('new')}
              className={`tab-btn ${activeTab === 'new' ? 'active' : 'inactive'}`}
            >
              New Purchase
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`tab-btn ${activeTab === 'my' ? 'active' : 'inactive'}`}
            >
              My Purchases
            </button>
          </nav>
        </div>

        {activeTab === 'new' && <PurchaseForm />}
        {activeTab === 'my' && <PurchaseList />}
      </main>
    </div>
  );
}


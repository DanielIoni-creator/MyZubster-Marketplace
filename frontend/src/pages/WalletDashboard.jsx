import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './WalletDashboard.css';

const WalletDashboard = () => {
  const [myzBalance, setMyzBalance] = useState(null);
  const [xmrRate, setXmrRate] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('7d');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [paymentsRes, xmrRes] = await Promise.all([
        axios.get(`/api/payments`).catch(() => ({ data: { items: [] } })),
        axios.get(`/api/xmr/rate`).catch(() => ({ data: { data: { usd: 0 } } }))
      ]);

      const payments = paymentsRes.data?.items || [];
      setTransactions(payments);
      setXmrRate(xmrRes.data?.data || null);

      // Calculate MYZ balance from payments
      const totalEarned = payments
        .filter(p => p.currency === 'MYZ' && (p.status === 'COMPLETED' || p.status === 'CONFIRMING'))
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalWithdrawn = payments
        .filter(p => p.currency === 'MYZ' && p.status === 'CANCELLED')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      setMyzBalance({
        earned: totalEarned,
        withdrawn: totalWithdrawn,
        available: totalEarned - totalWithdrawn
      });

      // Generate notifications based on recent payments
      const recentPayments = payments
        .filter(p => new Date(p.createdAt) > new Date(Date.now() - 86400000)) // Last 24h
        .slice(0, 5);
      const newNotifications = recentPayments.map(p => ({
        id: p.id || p._id,
        type: p.status === 'COMPLETED' ? 'success' : p.status === 'FAILED' ? 'error' : 'info',
        message: `${p.currency === 'MYZ' ? '💰' : '🔷'} Pagamento ${p.amount} ${p.currency} — ${p.status}`,
        time: new Date(p.createdAt).toLocaleString()
      }));
      setNotifications(newNotifications);

    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('Impossibile caricare i dati del wallet. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const exportReport = () => {
    const headers = ['Data', 'Importo', 'Valuta', 'Stato', 'TX ID', 'Riferimento'];
    const rows = transactions.map(tx => [
      tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A',
      tx.amount || 0,
      tx.currency || 'MYZ',
      tx.status || 'N/A',
      tx.txId || 'N/A',
      tx.reference || 'N/A'
    ]);

    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wallet-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return '#27ae60';
      case 'CONFIRMING': return '#f39c12';
      case 'PENDING': return '#3498db';
      case 'FAILED':
      case 'CANCELLED': return '#e74c3c';
      case 'EXPIRED': return '#95a5a6';
      default: return '#7f8c8d';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'COMPLETED': 'Completato',
      'CONFIRMING': 'In conferma',
      'PENDING': 'In attesa',
      'FAILED': 'Fallito',
      'CANCELLED': 'Annullato',
      'EXPIRED': 'Scaduto'
    };
    return labels[status] || status;
  };

  // Performance chart data (simulated from transactions)
  const chartData = React.useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const data = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().slice(0, 10);
      const dayPayments = transactions.filter(tx => {
        const txDate = tx.createdAt ? tx.createdAt.slice(0, 10) : '';
        return txDate === dayStr;
      });
      const myzTotal = dayPayments
        .filter(p => p.currency === 'MYZ' && p.status === 'COMPLETED')
        .reduce((s, p) => s + (p.amount || 0), 0);
      const xmrTotal = dayPayments
        .filter(p => p.currency === 'XMR' && p.status === 'COMPLETED')
        .reduce((s, p) => s + (p.amount || 0), 0);
      data.push({
        date: dayStr.slice(5),
        myz: myzTotal,
        xmr: xmrTotal
      });
    }
    return data;
  }, [transactions, period]);

  const maxChartValue = Math.max(...chartData.map(d => Math.max(d.myz, d.xmr, 1)), 1);

  if (loading && !myzBalance) {
    return <div className="loading">💼 Caricamento wallet...</div>;
  }

  return (
    <div className="wallet-dashboard">
      <header className="dashboard-header wallet-header">
        <h1>💼 Wallet Unificato MYZ/XMR</h1>
        <p>Gestione unificata del portafoglio — saldi, transazioni e performance</p>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️</span> {error}
          <button onClick={fetchData} className="retry-btn">Riprova</button>
        </div>
      )}

      {/* Balance Cards */}
      <div className="balance-grid">
        <div className="balance-card myz-card">
          <div className="balance-icon">💰</div>
          <h3>Saldo MYZ</h3>
          <div className="balance-amount">{myzBalance?.available?.toFixed(2) || '0.00'} MYZ</div>
          <div className="balance-details">
            <span>Guadagnato: {myzBalance?.earned?.toFixed(2) || '0.00'} MYZ</span>
            <span>Ritirato: {myzBalance?.withdrawn?.toFixed(2) || '0.00'} MYZ</span>
          </div>
        </div>

        <div className="balance-card xmr-card">
          <div className="balance-icon">🔷</div>
          <h3>XMR Rate</h3>
          <div className="balance-amount">
            {xmrRate?.usd ? `$${xmrRate.usd.toFixed(2)}` : '--'}
          </div>
          <div className="balance-details">
            <span>1 XMR = ${xmrRate?.usd?.toFixed(2) || '--'}</span>
            <span>Aggiornato in tempo reale</span>
          </div>
        </div>

        <div className="balance-card total-card">
          <div className="balance-icon">📊</div>
          <h3>Totale Transazioni</h3>
          <div className="balance-amount">{transactions.length}</div>
          <div className="balance-details">
            <span>Completate: {transactions.filter(t => t.status === 'COMPLETED').length}</span>
            <span>In attesa: {transactions.filter(t => t.status === 'PENDING' || t.status === 'CONFIRMING').length}</span>
          </div>
        </div>

        <div className="balance-card fee-card">
          <div className="balance-icon">⚡</div>
          <h3>Commissioni</h3>
          <div className="balance-amount">
            {transactions
              .filter(t => t.status === 'COMPLETED')
              .reduce((s, t) => s + ((t.fee || 0) + (t.confirmations || 0) * 0.001), 0)
              .toFixed(4)} MYZ
          </div>
          <div className="balance-details">
            <span>Commissioni totali accumulate</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-section">
          <h2>🔔 Notifiche recenti</h2>
          <div className="notifications-list">
            {notifications.map((n, i) => (
              <div key={n.id || i} className={`notification-item ${n.type}`}>
                <span className="notification-message">{n.message}</span>
                <span className="notification-time">{n.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Chart */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>📈 Performance</h2>
          <div className="period-selector">
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                className={`period-btn ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p === '7d' ? '7 Giorni' : p === '30d' ? '30 Giorni' : '90 Giorni'}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-container">
          <div className="bar-chart">
            {chartData.map((d, i) => (
              <div key={i} className="bar-group" title={`${d.date}: MYZ ${d.myz}, XMR ${d.xmr}`}>
                <div className="bar myz-bar" style={{ height: `${(d.myz / maxChartValue) * 100}%` }}>
                  <span className="bar-value">{d.myz > 0 ? d.myz : ''}</span>
                </div>
                <div className="bar xmr-bar" style={{ height: `${(d.xmr / maxChartValue) * 100}%` }}>
                  <span className="bar-value">{d.xmr > 0 ? d.xmr.toFixed(2) : ''}</span>
                </div>
                <div className="bar-label">{d.date}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><span className="legend-dot myz-dot"></span> MYZ</span>
            <span><span className="legend-dot xmr-dot"></span> XMR</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-section">
        <div className="transactions-header">
          <h2>💳 Transazioni</h2>
          <button onClick={exportReport} className="export-btn">
            📥 Esporta CSV
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Importo</th>
                <th>Valuta</th>
                <th>Stato</th>
                <th>TX ID</th>
                <th>Riferimento</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">Nessuna transazione trovata</td>
                </tr>
              ) : (
                transactions.map((tx, index) => (
                  <tr key={tx.id || tx._id || index}>
                    <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</td>
                    <td className="amount">{tx.amount?.toFixed(2) || '0.00'}</td>
                    <td>
                      <span className="currency-badge">{tx.currency || 'MYZ'}</span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(tx.status) }}
                      >
                        {getStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="tx-id">{tx.txId ? tx.txId.slice(0, 16) + '...' : '—'}</td>
                    <td>{tx.reference || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
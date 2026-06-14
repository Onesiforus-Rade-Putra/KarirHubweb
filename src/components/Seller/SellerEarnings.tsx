import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDownLeft, CreditCard, Download, Landmark, Layers, Loader2, Pencil, Plus, RefreshCw, Trash2, Wallet } from "lucide-react";
import {
  createSellerPayoutAccount,
  createSellerWithdrawal,
  deleteSellerPayoutAccount,
  downloadSellerEarningsCsv,
  fetchSellerEarnings,
  SellerEarningHistoryItem,
  SellerEarningsPayload,
  SellerEarningsSummary,
  SellerPayoutAccount,
  updateSellerPayoutAccount,
} from "../../lib/karirHubApi";
import { ServiceOrder } from "../../types";

interface EarningsProps {
  earnings?: SellerEarningsSummary | null;
  orders?: ServiceOrder[];
  onUnavailableAction?: (message?: string) => void;
  toast?: (msg: string, status?: string) => void;
  setActiveTab?: (tab: string) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price || 0);

const emptyAccount = { bankName: "", accountNumber: "", accountHolderName: "" };

const statusLabel: Record<string, string> = {
  all: "Semua status",
  pending: "Pending",
  accepted: "Diterima",
  in_progress: "Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const withdrawalTone: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  paid: "bg-emerald-100 text-emerald-700",
};

const StatBox = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className="min-h-[118px] rounded-lg border border-slate-200 bg-white p-5">
    <p className="text-sm font-bold text-slate-500">{label}</p>
    <p className={`mt-3 text-2xl font-black leading-tight ${tone}`}>{value}</p>
  </div>
);

export const SellerEarnings: React.FC<EarningsProps> = ({ earnings: initialEarnings, toast, setActiveTab }) => {
  const [payload, setPayload] = useState<SellerEarningsPayload | null>(null);
  const [period, setPeriod] = useState("all");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingAccount, setEditingAccount] = useState<SellerPayoutAccount | null>(null);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const filters = useMemo(
    () => ({
      period,
      status,
      startDate: period === "custom" ? startDate : "",
      endDate: period === "custom" ? endDate : "",
    }),
    [endDate, period, startDate, status]
  );

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchSellerEarnings(filters);
      setPayload(data);
      if (!selectedAccountId && data.payoutAccounts[0]) setSelectedAccountId(data.payoutAccounts[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pendapatan seller.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const summary = payload?.earnings || initialEarnings || {
    total_orders: 0,
    completed_orders: 0,
    pending_orders: 0,
    gross_revenue: 0,
    platform_commission: 0,
    platform_commission_rate: 0.1,
    net_revenue: 0,
    estimated_net_revenue: 0,
    available_balance: 0,
    held_balance: 0,
    total_withdrawn: 0,
  };
  const accounts = payload?.payoutAccounts || [];
  const withdrawals = payload?.withdrawals || [];
  const history = payload?.history || [];

  const showSuccess = (message: string) => {
    setSuccess(message);
    toast?.(message, "success");
  };

  const handleSubmitAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      if (editingAccount) {
        await updateSellerPayoutAccount({ id: editingAccount.id, ...accountForm });
        showSuccess("Rekening pencairan berhasil diperbarui.");
      } else {
        await createSellerPayoutAccount(accountForm);
        showSuccess("Rekening pencairan berhasil ditambahkan.");
      }
      setEditingAccount(null);
      setAccountForm(emptyAccount);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan rekening.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAccount = (account: SellerPayoutAccount) => {
    setEditingAccount(account);
    setAccountForm({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolderName: account.accountHolderName,
    });
  };

  const handleDeleteAccount = async (account: SellerPayoutAccount) => {
    if (!window.confirm(`Hapus rekening ${account.bankName} ${account.accountNumber}?`)) return;
    setIsSaving(true);
    setError("");
    try {
      await deleteSellerPayoutAccount(account.id);
      if (selectedAccountId === account.id) setSelectedAccountId("");
      showSuccess("Rekening pencairan berhasil dihapus.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus rekening.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateWithdrawal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!window.confirm("Ajukan penarikan saldo simulasi? Tidak ada transfer uang sungguhan.")) return;
    setIsSaving(true);
    setError("");
    try {
      const amount = Number(withdrawalAmount);
      const result = await createSellerWithdrawal({ payoutAccountId: selectedAccountId, amount });
      showSuccess(result.message || "Pengajuan penarikan saldo berhasil dibuat.");
      setWithdrawalAmount("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat pengajuan penarikan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    setIsSaving(true);
    setError("");
    try {
      const csv = await downloadSellerEarningsCsv(filters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `seller-earnings-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess("Laporan CSV berhasil dibuat.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export laporan gagal.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1536px] px-8 py-12 text-left">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-[40px] font-black leading-tight tracking-normal text-slate-950">Pendapatan</h1>
          <p className="mt-2 text-xl text-slate-600">Kelola saldo, rekening pencairan, dan riwayat transaksi Anda</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={loadData} disabled={isLoading || isSaving} className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Muat Ulang
          </button>
          <button onClick={handleExport} disabled={isLoading || isSaving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-60">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}
      {success && !error && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-6">
        <StatBox label="Pendapatan Kotor" value={formatPrice(summary.gross_revenue)} tone="text-slate-950" />
        <StatBox label="Komisi Platform 10%" value={formatPrice(summary.platform_commission)} tone="text-red-600" />
        <StatBox label="Pendapatan Bersih" value={formatPrice(summary.net_revenue || summary.estimated_net_revenue)} tone="text-emerald-600" />
        <StatBox label="Saldo Tersedia" value={formatPrice(summary.available_balance)} tone="text-purple-600" />
        <StatBox label="Saldo Tertahan" value={formatPrice(summary.held_balance)} tone="text-amber-600" />
        <StatBox label="Total Penarikan" value={formatPrice(summary.total_withdrawn)} tone="text-blue-600" />
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[180px_180px_180px_180px_auto] lg:items-end">
          <label className="text-sm font-bold text-slate-600">
            Periode
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-slate-900">
              <option value="all">Semua</option>
              <option value="this_month">Bulan ini</option>
              <option value="last_30_days">30 hari terakhir</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-600">
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-slate-900">
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-600">
            Dari
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={period !== "custom"} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-slate-900 disabled:bg-slate-100" />
          </label>
          <label className="text-sm font-bold text-slate-600">
            Sampai
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={period !== "custom"} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-slate-900 disabled:bg-slate-100" />
          </label>
          <p className="text-sm font-semibold text-slate-500">{summary.completed_orders} pesanan selesai dari {summary.total_orders} pesanan.</p>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="space-y-8">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black text-slate-950">Riwayat Pendapatan</h2>
              {isLoading && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
            </div>
            <div className="mt-6 space-y-4">
              {!isLoading && history.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-base font-black text-slate-800">Belum ada riwayat pada filter ini.</p>
                  <p className="mt-2 text-sm font-medium text-slate-500">Pendapatan muncul dari order nyata milik seller.</p>
                </div>
              )}
              {history.map((item: SellerEarningHistoryItem) => (
                <article key={item.id} className="grid gap-4 rounded-lg border border-slate-200 p-5 md:grid-cols-[1fr_190px] md:items-center">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <ArrowDownLeft className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-slate-950">{item.serviceTitle}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{item.buyerName} - {item.date || "Tanggal tidak tersedia"}</p>
                      <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{statusLabel[item.orderStatus] || item.status}</span>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xl font-black text-emerald-600">{formatPrice(item.netAmount)}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">Kotor {formatPrice(item.grossAmount)} - komisi {formatPrice(item.platformFee)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black text-slate-950">Riwayat Penarikan</h2>
            <div className="mt-6 space-y-4">
              {withdrawals.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-7 text-center text-sm font-semibold text-slate-500">Belum ada pengajuan penarikan saldo.</div>
              )}
              {withdrawals.map((item) => (
                <article key={item.id} className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-lg font-black text-slate-950">{formatPrice(item.amount)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{item.account?.bankName || "Rekening dihapus"} - {item.requestedAt?.slice(0, 10)}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">Simulasi prototype, tidak ada transfer uang sungguhan.</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-sm font-bold ${withdrawalTone[item.status] || "bg-slate-100 text-slate-700"}`}>{item.status}</span>
                </article>
              ))}
            </div>
          </section>
        </main>

        <aside className="space-y-8">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black text-slate-950">Ajukan Penarikan</h2>
            <form onSubmit={handleCreateWithdrawal} className="mt-5 space-y-4">
              <label className="block text-sm font-bold text-slate-600">
                Rekening
                <select value={selectedAccountId} onChange={(event) => setSelectedAccountId(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-slate-900">
                  <option value="">Pilih rekening</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNumber}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold text-slate-600">
                Nominal
                <input type="number" min="1" value={withdrawalAmount} onChange={(event) => setWithdrawalAmount(event.target.value)} placeholder="Contoh: 100000" className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-slate-900" />
              </label>
              <button disabled={isSaving || accounts.length === 0} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Ajukan Penarikan
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black text-slate-950">Rekening Pencairan</h2>
            <form onSubmit={handleSubmitAccount} className="mt-5 space-y-4">
              <input value={accountForm.bankName} onChange={(event) => setAccountForm((prev) => ({ ...prev, bankName: event.target.value }))} placeholder="Nama bank" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-slate-900" required />
              <input value={accountForm.accountNumber} onChange={(event) => setAccountForm((prev) => ({ ...prev, accountNumber: event.target.value }))} placeholder="Nomor rekening" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-slate-900" required />
              <input value={accountForm.accountHolderName} onChange={(event) => setAccountForm((prev) => ({ ...prev, accountHolderName: event.target.value }))} placeholder="Nama pemilik" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-slate-900" required />
              <div className="flex gap-3">
                <button disabled={isSaving} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60">
                  {editingAccount ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingAccount ? "Simpan" : "Tambah"}
                </button>
                {editingAccount && (
                  <button type="button" onClick={() => { setEditingAccount(null); setAccountForm(emptyAccount); }} className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    Batal
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {accounts.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">Belum ada rekening pencairan.</div>
              )}
              {accounts.map((account) => (
                <article key={account.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black text-slate-950">{account.bankName}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{account.accountNumber} - {account.accountHolderName}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => handleEditAccount(account)} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button onClick={() => handleDeleteAccount(account)} className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 text-sm font-bold text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-black text-slate-950">Aksi Cepat</h2>
            <button onClick={() => setActiveTab?.("seller-services")} className="mt-5 flex h-11 w-full items-center gap-3 rounded-lg border border-slate-200 px-4 text-left font-semibold text-slate-700 hover:bg-slate-50">
              <Layers className="h-4 w-4 text-purple-600" />
              Lihat Layanan
            </button>
            <button onClick={() => setActiveTab?.("seller-orders")} className="mt-3 flex h-11 w-full items-center gap-3 rounded-lg border border-slate-200 px-4 text-left font-semibold text-slate-700 hover:bg-slate-50">
              <CreditCard className="h-4 w-4 text-purple-600" />
              Kelola Pesanan
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};

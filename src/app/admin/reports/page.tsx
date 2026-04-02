"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock, Shield, Package, Sparkles } from "lucide-react";

interface Report {
    id: string;
    type: "asset" | "comment";
    targetId: string;
    assetId: string;
    reason: string;
    reporterEmail: string;
    status: string;
    createdAt: string;
    extraData?: any;
}

export default function AdminReportsPage() {
    const { user, isLoading } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || user.email !== "kaioadrik08@gmail.com")) {
            notFound();
        } else if (!isLoading && user?.email === "kaioadrik08@gmail.com") {
            fetchReports();
        }
    }, [isLoading, user]);

    const fetchReports = async () => {
        setLoadingReports(true);
        try {
            const res = await fetch(`/api/reports?email=${encodeURIComponent(user?.email || "")}`);
            const data = await res.json();
            if (data.success) {
                setReports(data.reports);
            }
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoadingReports(false);
        }
    };

    const handleAction = async (reportId: string, action: "dismiss" | "delete_content", targetType: string, targetId: string, assetId: string) => {
        if (!confirm(`Are you sure you want to ${action === 'dismiss' ? 'dismiss this report' : 'DELETE the reported content'}?`)) return;
        
        setActioningId(reportId);
        try {
            const res = await fetch(`/api/reports/${reportId}/resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    action, 
                    adminEmail: user?.email,
                    targetType,
                    targetId,
                    assetId
                })
            });

            if (res.ok) {
                setReports(reports.filter(r => r.id !== reportId));
            } else {
                alert("Action failed.");
            }
        } catch (error) {
            console.error("Action error", error);
        } finally {
            setActioningId(null);
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" /></div>;

    return (
        <div className="min-h-screen pt-24 px-4 pb-20 max-w-6xl mx-auto">
            <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white flex items-center gap-3">
                        <Shield className="text-yellow-500" size={32} /> User Reports Queue
                    </h1>
                    <p className="text-gray-400 mt-2">Manage user reports for assets and comments.</p>
                </div>
                <Link href="/admin/pending" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-bold transition-all transition-colors cursor-pointer whitespace-nowrap">
                    <Package size={20} /> Go to Asset Approvals
                </Link>
            </div>

            {loadingReports ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                </div>
            ) : reports.length === 0 ? (
                <div className="glass-panel p-16 rounded-3xl flex flex-col items-center justify-center text-center border border-white/5">
                    <Sparkles size={64} className="mb-4 opacity-50 mx-auto text-yellow-400" />
                    <h3 className="text-xl font-bold text-white mb-2">No pending reports</h3>
                    <p className="text-gray-400">The community is clean. Good job!</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {reports.map(report => (
                        <div key={report.id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center">
                            {/* Report Details */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${report.type === 'asset' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {report.type}
                                    </span>
                                    <span className="text-gray-500 text-sm">{new Date(report.createdAt).toLocaleString()}</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-1">Reason: {report.reason}</h4>
                                <p className="text-sm text-gray-400 mb-2">Reported by: <span className="text-gray-300 font-mono">{report.reporterEmail}</span></p>
                                
                                <div className="bg-dark-bg p-4 rounded-xl border border-white/5 mt-3">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Target Information</p>
                                    <p className="text-sm font-mono text-gray-300">Target ID: {report.targetId}</p>
                                    <p className="text-sm font-mono text-gray-300">Asset ID: {report.assetId}</p>
                                    {report.extraData?.text && (
                                        <div className="mt-2 text-sm italic border-l-2 border-white/20 pl-3 py-1 text-gray-400">"{report.extraData.text}"</div>
                                    )}
                                    <Link href={`/asset/${report.assetId}`} target="_blank" className="text-violet-400 text-sm hover:underline mt-2 inline-block">View Context Asset ↗</Link>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-row md:flex-col gap-3 w-full md:w-48 shrink-0">
                                <button
                                    onClick={() => handleAction(report.id, 'dismiss', report.type, report.targetId, report.assetId)}
                                    disabled={actioningId === report.id}
                                    className="w-full px-4 py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 text-white transition-colors"
                                >
                                    Dismiss Report
                                </button>
                                <button
                                    onClick={() => handleAction(report.id, 'delete_content', report.type, report.targetId, report.assetId)}
                                    disabled={actioningId === report.id}
                                    className="w-full px-4 py-3 rounded-xl font-bold text-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-500 transition-colors"
                                >
                                    Delete Content
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

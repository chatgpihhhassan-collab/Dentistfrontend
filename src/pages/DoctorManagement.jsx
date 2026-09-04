import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { ShieldCheck, User, MapPin, Key, Edit, Save, X } from 'lucide-react';

export default function DoctorManagement() {
    const [doctors, setDoctors] = useState([]);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchDoctors = async () => {
        try {
            const res = await fetch('/api/auth/doctors');
            if (res.ok) {
                const data = await res.json();
                setDoctors(data);
            }
        } catch (err) {
            setError('Failed to fetch doctors.');
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`/api/auth/doctors/${editingDoctor.doctorID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: editingDoctor.firstName,
                    lastName: editingDoctor.lastName,
                    region: editingDoctor.region
                })
            });

            if (res.ok) {
                if (editingDoctor.newPassword) {
                    const passRes = await fetch(`/api/auth/doctors/${editingDoctor.doctorID}/password`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: editingDoctor.newPassword })
                    });
                    if (!passRes.ok) {
                        setError('Details updated, but failed to update password.');
                        return;
                    }
                }
                setSuccess('Doctor updated successfully!');
                setEditingDoctor(null);
                fetchDoctors();
            } else {
                setError('Failed to update doctor details.');
            }
        } catch (err) {
            setError('Server connection error.');
        }
    };

    return (
        <div className="min-h-screen bg-warm-cream text-dark-slate font-sans pb-20 relative">
            <Navigation />
            
            <main className="max-w-7xl mx-auto px-8 pt-12">
                <div className="mb-10 flex items-center space-x-4">
                    <ShieldCheck className="w-10 h-10 text-primary-teal" />
                    <h1 className="text-4xl font-serif font-bold text-dark-slate tracking-tight">Super Admin - Doctor Management</h1>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 mb-6 font-bold">{error}</div>}
                {success && <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 mb-6 font-bold">{success}</div>}

                <div className="bg-white rounded-3xl shadow-sm border border-light-teal/60 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-light-teal/30 border-b border-light-teal/50">
                                <th className="py-5 px-6 font-bold text-muted-text uppercase tracking-wider text-sm">Doctor</th>
                                <th className="py-5 px-6 font-bold text-muted-text uppercase tracking-wider text-sm">Username</th>
                                <th className="py-5 px-6 font-bold text-muted-text uppercase tracking-wider text-sm">Region</th>
                                <th className="py-5 px-6 font-bold text-muted-text uppercase tracking-wider text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {doctors.map(doc => (
                                <tr key={doc.doctorID} className="border-b border-light-teal/20 hover:bg-light-teal/10 transition-colors">
                                    <td className="py-5 px-6 font-bold text-dark-slate">
                                        Dr. {doc.firstName} {doc.lastName}
                                    </td>
                                    <td className="py-5 px-6 font-medium text-muted-text">
                                        {doc.username}
                                    </td>
                                    <td className="py-5 px-6 font-medium text-muted-text">
                                        {doc.region}
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <button 
                                            onClick={() => setEditingDoctor({ ...doc, newPassword: '' })}
                                            className="inline-flex items-center space-x-2 text-muted-text hover:text-primary-teal font-bold px-4 py-2 rounded-lg hover:bg-light-teal/40 transition-colors cursor-pointer"
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span>Edit</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {doctors.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-12 text-center text-muted-text font-medium">No doctors found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {editingDoctor && (
                <div className="fixed inset-0 bg-dark-slate/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-light-teal">
                        <div className="px-8 py-6 border-b border-light-teal/40 flex items-center justify-between bg-light-teal/30">
                            <h3 className="text-2xl font-serif font-bold text-dark-slate">Edit Doctor</h3>
                            <button onClick={() => setEditingDoctor(null)} className="p-2 text-muted-text hover:text-dark-slate hover:bg-light-teal/40 rounded-full transition-colors cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-text uppercase tracking-wider ml-4">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                                        <input 
                                            type="text" 
                                            value={editingDoctor.firstName}
                                            onChange={e => setEditingDoctor({...editingDoctor, firstName: e.target.value})}
                                            className="w-full pl-12 pr-4 py-3 bg-light-teal/20 border border-light-teal/60 rounded-xl focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/20 font-medium text-dark-slate"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-text uppercase tracking-wider ml-4">Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                                        <input 
                                            type="text" 
                                            value={editingDoctor.lastName}
                                            onChange={e => setEditingDoctor({...editingDoctor, lastName: e.target.value})}
                                            className="w-full pl-12 pr-4 py-3 bg-light-teal/20 border border-light-teal/60 rounded-xl focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/20 font-medium text-dark-slate"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-text uppercase tracking-wider ml-4">Region</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
                                    <input 
                                        type="text" 
                                        value={editingDoctor.region}
                                        onChange={e => setEditingDoctor({...editingDoctor, region: e.target.value})}
                                        className="w-full pl-12 pr-4 py-3 bg-light-teal/20 border border-light-teal/60 rounded-xl focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/20 font-medium text-dark-slate"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-light-teal/40">
                                <label className="text-sm font-bold text-muted-text uppercase tracking-wider ml-4">New Password (Optional)</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-teal" />
                                    <input 
                                        type="password" 
                                        placeholder="Leave blank to keep current"
                                        value={editingDoctor.newPassword}
                                        onChange={e => setEditingDoctor({...editingDoctor, newPassword: e.target.value})}
                                        className="w-full pl-12 pr-4 py-3 bg-light-teal/20 border border-light-teal/60 rounded-xl focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/20 font-medium text-dark-slate"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex space-x-4">
                                <button type="button" onClick={() => setEditingDoctor(null)} className="flex-1 py-3 bg-light-teal/30 hover:bg-light-teal text-muted-text font-bold rounded-xl transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-3 bg-primary-teal hover:bg-primary-hover text-white font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

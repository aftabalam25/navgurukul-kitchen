import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, KitchenSchedule, SwapRequest } from '../lib/supabase';
import { Calendar, Users, ArrowLeftRight, Check, X, LogOut, CircleUser as UserCircle } from 'lucide-react';
import { SwapRequestModal } from '../components/SwapRequestModal';

export const UserDashboard: React.FC = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const [schedules, setSchedules] = useState<KitchenSchedule[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPresent, setIsPresent] = useState(profile?.is_present || true);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<KitchenSchedule | null>(null);

  useEffect(() => {
    if (profile) {
      setIsPresent(profile.is_present);
      fetchSchedules();
      fetchSwapRequests();
    }
  }, [profile]);

  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from('kitchen_schedules')
      .select(`
        *,
        profile:profiles(*)
      `)
      .order('scheduled_date', { ascending: true });

    if (!error && data) {
      setSchedules(data);
    }
    setLoading(false);
  };

  const fetchSwapRequests = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from('swap_requests')
      .select(`
        *,
        requester:profiles!swap_requests_requester_id_fkey(*),
        target:profiles!swap_requests_target_id_fkey(*),
        requester_schedule:kitchen_schedules!swap_requests_requester_schedule_id_fkey(*),
        target_schedule:kitchen_schedules!swap_requests_target_schedule_id_fkey(*)
      `)
      .or(`requester_id.eq.${profile.id},target_id.eq.${profile.id}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSwapRequests(data);
    }
  };

  const togglePresence = async () => {
    if (!profile) return;

    const newPresence = !isPresent;
    const { error } = await supabase
      .from('profiles')
      .update({ is_present: newPresence })
      .eq('id', profile.id);

    if (!error) {
      setIsPresent(newPresence);
      await refreshProfile();
    }
  };

  const handleSwapResponse = async (requestId: string, accept: boolean) => {
    const { error } = await supabase
      .from('swap_requests')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', requestId);

    if (!error) {
      if (accept) {
        const request = swapRequests.find(r => r.id === requestId);
        if (request) {
          await supabase
            .from('kitchen_schedules')
            .update({ user_id: request.target_id })
            .eq('id', request.requester_schedule_id);

          await supabase
            .from('kitchen_schedules')
            .update({ user_id: request.requester_id })
            .eq('id', request.target_schedule_id);
        }
      }
      fetchSwapRequests();
      fetchSchedules();
    }
  };

  const mySchedules = schedules.filter(s => s.user_id === profile?.id);
  const incomingRequests = swapRequests.filter(r => r.target_id === profile?.id);

  const handleSwapClick = (schedule: KitchenSchedule) => {
    setSelectedSchedule(schedule);
    setSwapModalOpen(true);
  };

  const handleSwapSuccess = () => {
    fetchSwapRequests();
    fetchSchedules();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kitchen Duty Manager</h1>
                <p className="text-sm text-gray-600">{profile?.full_name}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <UserCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Presence Status</h3>
                  <p className="text-sm text-gray-600">{profile?.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">I am available</span>
              <button
                onClick={togglePresence}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isPresent ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isPresent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
            <Calendar className="w-8 h-8 mb-2" />
            <h3 className="text-2xl font-bold">{mySchedules.length}</h3>
            <p className="text-blue-100">My Upcoming Duties</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white">
            <ArrowLeftRight className="w-8 h-8 mb-2" />
            <h3 className="text-2xl font-bold">{incomingRequests.length}</h3>
            <p className="text-orange-100">Pending Requests</p>
          </div>
        </div>

        {incomingRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <ArrowLeftRight className="w-6 h-6 mr-2 text-orange-600" />
              Swap Requests
            </h2>
            <div className="space-y-4">
              {incomingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-900">
                      {request.requester?.full_name} wants to swap duties
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Your date: {new Date(request.target_schedule?.scheduled_date || '').toLocaleDateString()} ↔️ Their date: {new Date(request.requester_schedule?.scheduled_date || '').toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSwapResponse(request.id, true)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleSwapResponse(request.id, false)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            All Kitchen Duties
          </h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No schedules available yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        schedule.user_id === profile?.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {new Date(schedule.scheduled_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 text-gray-900">{schedule.profile?.full_name}</td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{schedule.profile?.email}</td>
                      <td className="py-3 px-4">
                        {schedule.is_completed ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Completed
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {schedule.user_id === profile?.id && !schedule.is_completed && (
                          <button
                            onClick={() => handleSwapClick(schedule)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors text-sm font-medium"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                            <span>Swap</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedSchedule && (
        <SwapRequestModal
          isOpen={swapModalOpen}
          onClose={() => {
            setSwapModalOpen(false);
            setSelectedSchedule(null);
          }}
          mySchedule={selectedSchedule}
          allSchedules={schedules}
          currentUserId={profile?.id || ''}
          onSuccess={handleSwapSuccess}
        />
      )}
    </div>
  );
};

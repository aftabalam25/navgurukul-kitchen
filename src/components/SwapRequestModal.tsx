import React, { useState } from 'react';
import { supabase, KitchenSchedule } from '../lib/supabase';
import { X, ArrowLeftRight } from 'lucide-react';

interface SwapRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  mySchedule: KitchenSchedule;
  allSchedules: KitchenSchedule[];
  currentUserId: string;
  onSuccess: () => void;
}

export const SwapRequestModal: React.FC<SwapRequestModalProps> = ({
  isOpen,
  onClose,
  mySchedule,
  allSchedules,
  currentUserId,
  onSuccess,
}) => {
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const otherSchedules = allSchedules.filter(
    (s) => s.user_id !== currentUserId && !s.is_completed
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedScheduleId) {
      setError('Please select a schedule to swap with');
      setLoading(false);
      return;
    }

    const targetSchedule = allSchedules.find((s) => s.id === selectedScheduleId);
    if (!targetSchedule) {
      setError('Invalid schedule selected');
      setLoading(false);
      return;
    }

    const { error: swapError } = await supabase.from('swap_requests').insert({
      requester_id: currentUserId,
      target_id: targetSchedule.user_id,
      requester_schedule_id: mySchedule.id,
      target_schedule_id: targetSchedule.id,
      status: 'pending',
    });

    if (swapError) {
      setError(swapError.message);
      setLoading(false);
    } else {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ArrowLeftRight className="w-6 h-6 mr-2 text-blue-600" />
            Request Swap
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Your Current Date:</p>
          <p className="text-lg font-bold text-blue-900">
            {new Date(mySchedule.scheduled_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select date to swap with:
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a date</option>
              {otherSchedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {new Date(schedule.scheduled_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  - {schedule.profile?.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedScheduleId}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

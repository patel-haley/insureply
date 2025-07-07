import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, FileText, Building, DollarSign, Calendar, User, CheckCircle } from 'lucide-react';

interface PolicyRequestModalProps {
  type: 'new_policy' | 'edit_policy';
  family: {
    id: string;
    family_members: {
      id: string;
      user_id: string;
      profiles: {
        first_name: string;
        last_name: string;
      };
    }[];
  };
  policy?: {
    id: string;
    policy_type: string;
    policy_number: string;
    insurance_company: string;
    premium_amount: number;
    coverage_amount: number;
    start_date: string;
    end_date: string;
    policy_holder_id: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PolicyRequestModal: React.FC<PolicyRequestModalProps> = ({
  type,
  family,
  policy,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    policy_type: policy?.policy_type || '',
    policy_number: policy?.policy_number || '',
    insurance_company: policy?.insurance_company || '',
    premium_amount: policy?.premium_amount?.toString() || '',
    coverage_amount: policy?.coverage_amount?.toString() || '',
    start_date: policy?.start_date || '',
    end_date: policy?.end_date || '',
    policy_holder_id: policy?.policy_holder_id || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const requestData = {
        family_id: family.id,
        policy_holder_id: formData.policy_holder_id,
        policy_type: formData.policy_type,
        policy_number: formData.policy_number || null,
        insurance_company: formData.insurance_company || null,
        premium_amount: formData.premium_amount ? parseFloat(formData.premium_amount) : null,
        coverage_amount: formData.coverage_amount ? parseFloat(formData.coverage_amount) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      const { error } = await supabase.from('policy_requests').insert({
        family_id: family.id,
        requested_by: user.data.user.id,
        request_type: type,
        policy_id: type === 'edit_policy' ? policy?.id : null,
        request_data: requestData,
        status: 'pending',
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted!</h3>
          <p className="text-gray-600 mb-4">
            Your {type === 'new_policy' ? 'new policy' : 'policy edit'} request has been submitted for admin review.
          </p>
          <p className="text-sm text-gray-500">
            You'll be notified once it's been reviewed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {type === 'new_policy' ? 'Request New Policy' : 'Request Policy Edit'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {type === 'new_policy' 
              ? 'Submit a request for a new insurance policy. An admin will review and approve it.'
              : 'Submit changes to an existing policy. An admin will review and approve the changes.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Policy Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Type *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.policy_type}
                onChange={(e) => handleChange('policy_type', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select policy type</option>
                <option value="Life Insurance">Life Insurance</option>
                <option value="Health Insurance">Health Insurance</option>
                <option value="Auto Insurance">Auto Insurance</option>
                <option value="Home Insurance">Home Insurance</option>
                <option value="Disability Insurance">Disability Insurance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Policy Holder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Holder *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.policy_holder_id}
                onChange={(e) => handleChange('policy_holder_id', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select policy holder</option>
                {family.family_members.map((member) => (
                  <option key={member.id} value={member.user_id}>
                    {member.profiles.first_name} {member.profiles.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Policy Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Number
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.policy_number}
                onChange={(e) => handleChange('policy_number', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="POL-123456"
              />
            </div>
          </div>

          {/* Insurance Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Company
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.insurance_company}
                onChange={(e) => handleChange('insurance_company', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ABC Insurance Co."
              />
            </div>
          </div>

          {/* Premium and Coverage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Premium Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.premium_amount}
                  onChange={(e) => handleChange('premium_amount', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coverage Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  value={formData.coverage_amount}
                  onChange={(e) => handleChange('coverage_amount', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100000.00"
                />
              </div>
            </div>
          </div>

          {/* Start and End Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This request will be sent to administrators for review. 
              You'll be notified once it\'s been approved or if any changes are needed.
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PolicyRequestModal;
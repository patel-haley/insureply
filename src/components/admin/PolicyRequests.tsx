import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface PolicyRequest {
  id: string;
  request_type: 'new_policy' | 'edit_policy' | 'delete_policy';
  request_data: any;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  families: {
    family_name: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const PolicyRequests: React.FC = () => {
  const [requests, setRequests] = useState<PolicyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PolicyRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_requests')
        .select(`
          id,
          request_type,
          request_data,
          status,
          admin_notes,
          created_at,
          families (
            family_name
          ),
          profiles!policy_requests_requested_by_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('policy_requests')
        .update({
          status,
          admin_notes: adminNotes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved and it's a new policy request, create the policy
      if (status === 'approved' && selectedRequest?.request_type === 'new_policy') {
        const policyData = selectedRequest.request_data;
        await supabase.from('policies').insert({
          family_id: policyData.family_id,
          policy_holder_id: policyData.policy_holder_id,
          policy_type: policyData.policy_type,
          policy_number: policyData.policy_number,
          insurance_company: policyData.insurance_company,
          premium_amount: policyData.premium_amount,
          coverage_amount: policyData.coverage_amount,
          start_date: policyData.start_date,
          end_date: policyData.end_date,
          status: 'active',
        });
      }

      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (error) {
      console.error('Error processing request:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'new_policy':
        return 'New Policy';
      case 'edit_policy':
        return 'Edit Policy';
      case 'delete_policy':
        return 'Delete Policy';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Policy Requests</h2>
        <p className="text-gray-600">Review and manage policy change requests from clients.</p>
      </div>

      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {getStatusIcon(request.status)}
                  <span className="ml-2 font-medium text-gray-900">
                    {getRequestTypeLabel(request.request_type)}
                  </span>
                  <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Review
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  {request.profiles.first_name} {request.profiles.last_name}
                </div>
                <div className="flex items-center text-gray-600">
                  <FileText className="w-4 h-4 mr-2" />
                  {request.families.family_name}
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(request.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No policy requests found.</p>
        </div>
      )}

      {/* Request Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Review {getRequestTypeLabel(selectedRequest.request_type)} Request
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Request Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Requested by:</span>
                      <div className="font-medium">
                        {selectedRequest.profiles.first_name} {selectedRequest.profiles.last_name}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Family:</span>
                      <div className="font-medium">{selectedRequest.families.family_name}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Request Type:</span>
                      <div className="font-medium">{getRequestTypeLabel(selectedRequest.request_type)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <div className="font-medium">
                        {new Date(selectedRequest.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy Data */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Policy Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedRequest.request_data, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Admin Notes */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add notes about this request..."
                  />
                </div>
              )}

              {/* Existing Admin Notes */}
              {selectedRequest.admin_notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Previous Admin Notes</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedRequest.admin_notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
              
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleRequest(selectedRequest.id, 'rejected')}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleRequest(selectedRequest.id, 'approved')}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicyRequests;
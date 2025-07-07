import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { 
  Shield, 
  LogOut, 
  Users, 
  FileText, 
  Plus, 
  Edit3,
  DollarSign,
  Calendar,
  Building,
  User as UserIcon,
  CreditCard
} from 'lucide-react';
import PolicyRequestModal from './PolicyRequestModal';
import InsuranceCompanies from './InsuranceCompanies';

interface ClientDashboardProps {
  user: User;
}

interface Family {
  id: string;
  family_name: string;
  family_members: {
    id: string;
    user_id: string;
    relationship: string;
    is_primary: boolean;
    profiles: {
      first_name: string;
      last_name: string;
      email: string;
    };
  }[];
}

interface Policy {
  id: string;
  policy_type: string;
  policy_number: string;
  insurance_company: string;
  premium_amount: number;
  coverage_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  policy_holder_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ user }) => {
  const [family, setFamily] = useState<Family | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [activeTab, setActiveTab] = useState<'policies' | 'companies'>('policies');
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'new_policy' | 'edit_policy'>('new_policy');
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    fetchFamilyData();
  }, [user.id]);

  const fetchFamilyData = async () => {
    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Use the get-client-family-data Edge Function to avoid RLS issues
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-client-family-data`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch family data:', errorText);
        return; // Don't throw error, just return - user might not be in a family yet
      }

      const data = await response.json();
      if (data.success && data.family) {
        setFamily(data.family);
        setPolicies(data.policies || []);
      }
    } catch (error) {
      console.error('Error fetching family data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleNewPolicyRequest = () => {
    setRequestType('new_policy');
    setEditingPolicy(null);
    setShowRequestModal(true);
  };

  const handleEditPolicyRequest = (policy: Policy) => {
    setRequestType('edit_policy');
    setEditingPolicy(policy);
    setShowRequestModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your family information...</p>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Insurance Portal</h2>
          <p className="text-gray-600 mb-6">
            You haven't been added to a family group yet. Please contact your administrator to get started.
          </p>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Insurance Portal</h1>
                <p className="text-sm text-gray-600">{family.family_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Family Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Family Members
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {family.family_members.map((member) => (
              <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <h3 className="font-medium text-gray-900">
                    {member.profiles.first_name} {member.profiles.last_name}
                    {member.is_primary && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Primary
                      </span>
                    )}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">{member.profiles.email}</p>
                {member.relationship && (
                  <p className="text-sm text-gray-500">{member.relationship}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('policies')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'policies'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Family Policies ({policies.length})
              </button>
              <button
                onClick={() => setActiveTab('companies')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'companies'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building className="w-4 h-4 inline mr-2" />
                Insurance Companies
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === 'policies' ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="w-6 h-6 mr-2" />
                  Family Policies ({policies.length})
                </h2>
                <button
                  onClick={handleNewPolicyRequest}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Request New Policy
                </button>
              </div>

              {policies.length > 0 ? (
                <div className="grid gap-6">
                  {policies.map((policy) => (
                    <div key={policy.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 mr-3">
                            {policy.policy_type}
                          </h3>
                          <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(policy.status)}`}>
                            {policy.status}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEditPolicyRequest(policy)}
                          className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Request Edit
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm text-gray-600">Policy Number</p>
                            <p className="font-medium">{policy.policy_number || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Building className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm text-gray-600">Insurance Company</p>
                            <p className="font-medium">{policy.insurance_company || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm text-gray-600">Premium</p>
                            <p className="font-medium">
                              {policy.premium_amount ? `$${policy.premium_amount.toLocaleString()}` : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm text-gray-600">Coverage</p>
                            <p className="font-medium">
                              {policy.coverage_amount ? `$${policy.coverage_amount.toLocaleString()}` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center">
                          <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">
                            Policy Holder: <span className="font-medium">
                              {policy.profiles.first_name} {policy.profiles.last_name}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {policy.start_date ? new Date(policy.start_date).toLocaleDateString() : 'N/A'} - 
                          {policy.end_date ? new Date(policy.end_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Policies Yet</h3>
                  <p className="text-gray-600 mb-6">Your family doesn't have any policies yet.</p>
                  <button
                    onClick={handleNewPolicyRequest}
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Request Your First Policy
                  </button>
                </div>
              )}
            </>
          ) : (
            <InsuranceCompanies familyId={family.id} allPolicies={policies} />
          )}
        </div>
      </div>

      {/* Policy Request Modal */}
      {showRequestModal && (
        <PolicyRequestModal
          type={requestType}
          family={family}
          policy={editingPolicy}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            // Optionally refresh data or show success message
          }}
        />
      )}
    </div>
  );
};

export default ClientDashboard;
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  Users, 
  Mail, 
  Plus, 
  Edit3, 
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  Building,
  UserPlus,
  UserMinus
} from 'lucide-react';
import AddPolicyModal from './AddPolicyModal';
import EditPolicyModal from './EditPolicyModal';
import AddFamilyMemberModal from './AddFamilyMemberModal';
import FamilyPolicyRequests from './FamilyPolicyRequests';

interface FamilyDetailsProps {
  family: {
    id: string;
    family_name: string;
    primary_contact_email: string;
    created_at: string;
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
  };
  onBack: () => void;
  onUpdate: (family: any) => void;
}

interface Policy {
  id: string;
  policy_number: string;
  policy_type: string;
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

const FamilyDetails: React.FC<FamilyDetailsProps> = ({ family, onBack, onUpdate }) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [familyData, setFamilyData] = useState(family);

  useEffect(() => {
    fetchFamilyDetails();
  }, [family.id]);

  const fetchFamilyDetails = async () => {
    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Use the get-family-details Edge Function
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-family-details`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyId: family.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch family details: ${errorText}`);
      }

      const data = await response.json();
      if (data.success && data.family) {
        setFamilyData(data.family);
        setFamilyMembers(data.family.family_members || []);
        setPolicies(data.family.policies || []);
      }
    } catch (error) {
      console.error('Error fetching family details:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      const { error } = await supabase
        .from('policies')
        .delete()
        .eq('id', policyId);

      if (error) throw error;
      setPolicies(policies.filter(p => p.id !== policyId));
    } catch (error) {
      console.error('Error deleting policy:', error);
    }
  };

  const removeFamilyMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this family?`)) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      // Refresh family members
      fetchFamilyDetails();
    } catch (error) {
      console.error('Error removing family member:', error);
    }
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

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{family.family_name}</h2>
              <p className="text-gray-600">{family.primary_contact_email}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddPolicy(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Policy
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Family Members */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Family Members ({familyMembers.length})
            </h3>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {familyMembers.map((member) => (
              <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {member.profiles.first_name} {member.profiles.last_name}
                    {member.is_primary && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Primary
                      </span>
                    )}
                  </h4>
                  <button
                    onClick={() => removeFamilyMember(
                      member.id, 
                      `${member.profiles.first_name} ${member.profiles.last_name}`
                    )}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove from family"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Mail className="w-4 h-4 mr-2" />
                  {member.profiles.email}
                </div>
                {member.relationship && (
                  <div className="text-sm text-gray-600">
                    Relationship: {member.relationship}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Family: {family.family_name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Requests for this Family */}
        <div className="mb-8">
          <FamilyPolicyRequests 
            familyId={family.id} 
            familyName={family.family_name}
          />
        </div>

        {/* Policies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Policies ({policies.length})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading policies...</p>
            </div>
          ) : policies.length > 0 ? (
            <div className="grid gap-4">
              {policies.map((policy) => (
                <div key={policy.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900 mr-3">
                        {policy.policy_type}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(policy.status)}`}>
                        {policy.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingPolicy(policy)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePolicy(policy.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <FileText className="w-4 h-4 mr-1" />
                        Policy Number
                      </div>
                      <div className="font-medium">{policy.policy_number || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <Building className="w-4 h-4 mr-1" />
                        Insurance Company
                      </div>
                      <div className="font-medium">{policy.insurance_company || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Premium
                      </div>
                      <div className="font-medium">
                        {policy.premium_amount ? `$${policy.premium_amount.toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Coverage
                      </div>
                      <div className="font-medium">
                        {policy.coverage_amount ? `$${policy.coverage_amount.toLocaleString()}` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-600">Policy Holder: </span>
                        <span className="font-medium">
                          {policy.profiles.first_name} {policy.profiles.last_name}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        {policy.start_date ? new Date(policy.start_date).toLocaleDateString() : 'N/A'} - 
                        {policy.end_date ? new Date(policy.end_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No policies found for this family.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddPolicy && (
        <AddPolicyModal
          familyId={family.id}
          familyMembers={familyMembers}
          onClose={() => setShowAddPolicy(false)}
          onSuccess={() => {
            setShowAddPolicy(false);
            fetchFamilyDetails();
          }}
        />
      )}

      {editingPolicy && (
        <EditPolicyModal
          policy={editingPolicy}
          familyMembers={familyMembers}
          onClose={() => setEditingPolicy(null)}
          onSuccess={() => {
            setEditingPolicy(null);
            fetchFamilyDetails();
          }}
        />
      )}

      {showAddMember && (
        <AddFamilyMemberModal
          familyId={family.id}
          onClose={() => setShowAddMember(false)}
          onSuccess={() => {
            setShowAddMember(false);
            fetchFamilyDetails();
          }}
        />
      )}
    </div>
  );
};

export default FamilyDetails;
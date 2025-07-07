import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Mail, User, Plus, X, CheckCircle } from 'lucide-react';

const CreateFamily: React.FC = () => {
  const [familyName, setFamilyName] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [members, setMembers] = useState([{ name: '', email: '', relationship: '' }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addMember = () => {
    setMembers([...members, { name: '', email: '', relationship: '' }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: 'name' | 'email' | 'relationship', value: string) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create families');
      }
      
      if (!session) {
        throw new Error('No active session found');
      }

      // Call the Edge Function to create the family
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-family`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyName,
          primaryEmail,
          members: members.filter(m => m.name.trim() || m.email.trim()),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create family');
      }

      if (result.success) {
        setSuccess(true);
        
        // Show summary of what was added/skipped
        if (result.skippedMembers && result.skippedMembers.length > 0) {
          console.log('Some members were skipped:', result.skippedMembers);
        }
        
        setTimeout(() => {
          setFamilyName('');
          setPrimaryEmail('');
          setMembers([{ name: '', email: '', relationship: '' }]);
          setSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error creating family:', error);
      alert(`Error creating family: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Family Created Successfully!</h2>
          <p className="text-gray-600">The family has been added to the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Create New Family</h2>
        <p className="text-gray-600">Add a new family group to the system.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Family Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Family Name *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Smith Family"
              required
            />
          </div>
        </div>

        {/* Primary Contact Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Contact Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john.smith@example.com"
              required
            />
          </div>
        </div>

        {/* Family Members */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Family Members
            </label>
            <button
              type="button"
              onClick={addMember}
              className="flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Member
            </button>
          </div>

          <div className="space-y-4">
            {members.map((member, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateMember(index, 'name', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Full name"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => updateMember(index, 'email', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com (optional)"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={member.relationship}
                      onChange={(e) => updateMember(index, 'relationship', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Spouse, Child, Parent, etc."
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-2">
            <strong>Note:</strong> Email addresses are optional. Members with email addresses will be linked to their user accounts if they exist. 
            Members without emails (like children) will be recorded as family members but won't have user accounts until created separately.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Family...' : 'Create Family'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFamily;
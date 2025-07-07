import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Users, Mail, Calendar, Eye } from 'lucide-react';
import FamilyDetails from './FamilyDetails';

interface Family {
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
}

const FamilySearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);

  const searchFamilies = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Use the search-families Edge Function to avoid RLS policy recursion
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-families`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchTerm: searchTerm.trim()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${errorText}`);
      }

      const data = await response.json();
      setFamilies(data.families || []);
    } catch (error) {
      console.error('Error searching families:', error);
      alert('Error searching families. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchFamilies();
    }
  };

  if (selectedFamily) {
    return (
      <FamilyDetails 
        family={selectedFamily} 
        onBack={() => setSelectedFamily(null)}
        onUpdate={(updatedFamily) => {
          setFamilies(families.map(f => f.id === updatedFamily.id ? updatedFamily : f));
          setSelectedFamily(updatedFamily);
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Families</h2>
        
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by family name, email, or member name..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={searchFamilies}
            disabled={loading || !searchTerm.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mt-2">
          Search by family name, primary contact email, or any family member's first/last name.
        </p>
      </div>

      {families.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Search Results ({families.length})
          </h3>
          
          <div className="grid gap-4">
            {families.map((family) => (
              <div
                key={family.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Users className="w-5 h-5 text-blue-600 mr-2" />
                      <h4 className="text-lg font-medium text-gray-900">
                        {family.family_name}
                      </h4>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Mail className="w-4 h-4 mr-2" />
                      {family.primary_contact_email}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created {new Date(family.created_at).toLocaleDateString()}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{family.family_members.length}</span> family members
                      {family.family_members.length > 0 && (
                        <span className="ml-2 text-gray-500">
                          ({family.family_members.map(m => `${m.profiles.first_name} ${m.profiles.last_name}`).join(', ')})
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedFamily(family)}
                    className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchTerm && families.length === 0 && !loading && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No families found matching your search.</p>
          <p className="text-sm text-gray-500 mt-2">
            Try searching by family name, email address, or member name.
          </p>
        </div>
      )}
    </div>
  );
};

export default FamilySearch;
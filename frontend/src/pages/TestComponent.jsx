import React from 'react';
import PropertyDetailsCard from '../components/PropertyDetailsCard';

const TestComponent = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full flex justify-center">
        <PropertyDetailsCard
          onClose={() => alert('Close clicked')}
          onShare={() => alert('Share clicked')}
          onFavorite={() => alert('Favorite clicked')}
          onContactOwner={() => alert('Contact owner')}
          onViewDetails={() => alert('View details')}
        />
      </div>
    </div>
  );
};

export default TestComponent;

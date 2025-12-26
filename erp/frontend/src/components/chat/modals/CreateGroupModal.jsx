// frontend/src/components/chat/modals/CreateGroupModal.jsx
import { FaTimes, FaSearch } from 'react-icons/fa';

export default function CreateGroupModal({
    show,
    onClose,
    newGroupName,
    setNewGroupName,
    newGroupInitialChannel,
    setNewGroupInitialChannel,
    newGroupMembers,
    setNewGroupMembers,
    userSearch,
    searchUsers,
    searchResults,
    allUsers,
    handleCreateGroup,
    creatingGroup
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => !creatingGroup && onClose()}>
            <div className="bg-[#2b2b2b] rounded-xl w-full max-w-md h-[80vh] max-h-[600px] flex flex-col border border-[#3b3b3b] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Fixed Header */}
                <div className="flex-shrink-0 p-4 border-b border-[#3b3b3b] bg-[#2b2b2b]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Create New Group</h3>
                        <button
                            onClick={() => !creatingGroup && onClose()}
                            className="p-2 hover:bg-[#3b3b3b] rounded-lg text-gray-400 hover:text-white transition-colors"
                            disabled={creatingGroup}
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Group Name Input */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Group Name *</label>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="e.g. Project Alpha, Marketing Team"
                                className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white focus:border-green-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Initial Channel Name */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">First Channel</label>
                            <input
                                type="text"
                                value={newGroupInitialChannel}
                                onChange={(e) => setNewGroupInitialChannel(e.target.value)}
                                placeholder="e.g. General, Announcements"
                                className="w-full px-3 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white focus:border-green-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Selected Members - Fixed area, doesn't scroll */}
                {newGroupMembers.length > 0 && (
                    <div className="flex-shrink-0 px-4 py-3 border-b border-[#3b3b3b] bg-[#1f1f1f]">
                        <p className="text-xs text-gray-500 mb-2">Selected ({newGroupMembers.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                            {newGroupMembers.map(m => (
                                <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600/20 text-green-300 rounded-full text-xs">
                                    {m.name?.split(' ')[0]}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setNewGroupMembers(newGroupMembers.filter(x => x.id !== m.id)); }}
                                        className="hover:text-white"
                                    >
                                        <FaTimes className="text-[10px]" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Scrollable Content Area - Only users list scrolls */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="px-4 py-3 border-b border-[#3b3b3b] sticky top-0 bg-[#2b2b2b] z-10">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search people to add..."
                                value={userSearch}
                                onChange={(e) => searchUsers(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#1f1f1f] border border-[#3b3b3b] rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Users List */}
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider px-4 py-2 bg-[#1f1f1f] sticky top-0">
                            {userSearch ? 'Search Results' : 'All People'}
                        </p>
                        {(searchResults.length > 0 ? searchResults : allUsers).map(user => {
                            const isSelected = newGroupMembers.find(m => m.id === user.id);
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => {
                                        if (isSelected) {
                                            setNewGroupMembers(newGroupMembers.filter(m => m.id !== user.id));
                                        } else {
                                            setNewGroupMembers([...newGroupMembers, user]);
                                        }
                                    }}
                                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-green-600/10' : 'hover:bg-[#3b3b3b]'}`}
                                >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${isSelected ? 'bg-green-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                                        {isSelected ? '✓' : user.name?.[0] || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-sm truncate">{user.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{user.email || user.role}</p>
                                    </div>
                                    {isSelected && (
                                        <span className="text-xs text-green-400 flex-shrink-0">Added</span>
                                    )}
                                </div>
                            );
                        })}
                        {allUsers.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No users found</p>
                        )}
                    </div>
                </div>

                {/* Fixed Footer - Always visible */}
                <div className="flex-shrink-0 p-4 border-t border-[#3b3b3b] bg-[#2b2b2b] flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-400 flex-shrink-0">
                        {newGroupMembers.length} member{newGroupMembers.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            disabled={creatingGroup}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateGroup}
                            disabled={!newGroupName.trim() || creatingGroup}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            {creatingGroup ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Creating...
                                </>
                            ) : (
                                'Create Group'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

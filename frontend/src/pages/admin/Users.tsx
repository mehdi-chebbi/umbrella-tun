import { useState, useEffect, type FormEvent } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2, Users, Search } from 'lucide-react';
import api from '@/services/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
}

interface UserFormData {
  username: string;
  password: string;
  email: string;
  full_name: string;
  role: string;
}

const emptyForm: UserFormData = {
  username: '',
  password: '',
  email: '',
  full_name: '',
  role: 'viewer',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const usersData = response.data.users;
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch {
      setToast({ type: 'error', message: 'Erreur lors du chargement des utilisateurs.' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (editingUser) {
        // Update
        const updateData: Record<string, string> = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.put(`/users/${editingUser.id}`, updateData);
        setToast({ type: 'success', message: 'Utilisateur mis à jour avec succès.' });
      } else {
        // Create
        await api.post('/users', formData);
        setToast({ type: 'success', message: 'Utilisateur créé avec succès.' });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setFormError(axiosErr.response?.data?.error || 'Une erreur est survenue.');
      } else {
        setFormError('Une erreur est survenue.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await api.put(`/users/${user.id}`, { active: !user.active });
      setToast({
        type: 'success',
        message: user.active
          ? 'Utilisateur désactivé.'
          : 'Utilisateur activé.',
      });
      fetchUsers();
    } catch {
      setToast({ type: 'error', message: 'Erreur lors de la mise à jour.' });
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'utilisateur "${user.full_name}" ?`)) {
      return;
    }
    try {
      await api.delete(`/users/${user.id}`);
      setToast({ type: 'success', message: 'Utilisateur supprimé avec succès.' });
      fetchUsers();
    } catch {
      setToast({ type: 'error', message: 'Erreur lors de la suppression.' });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-lg shadow-lg text-sm text-white transition-all duration-300 ${
            toast.type === 'success' ? 'bg-umbrella-accent' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-umbrella-text">
            Gestion des Utilisateurs
          </h1>
          <p className="text-sm text-umbrella-text-secondary mt-1">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-umbrella-accent text-white text-sm font-medium rounded-lg hover:bg-umbrella-accent/90 transition-all duration-300"
        >
          <Plus size={16} />
          <span>Ajouter un utilisateur</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-umbrella-text-light" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-umbrella-border rounded-lg text-sm text-umbrella-text placeholder:text-umbrella-text-light focus:outline-none focus:ring-2 focus:ring-umbrella-accent/20 focus:border-umbrella-accent transition-all duration-300 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-umbrella-border overflow-hidden">
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="animate-spin text-umbrella-accent" size={24} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={32} className="mx-auto text-umbrella-border mb-3" strokeWidth={1.5} />
            <p className="text-sm text-umbrella-text-light">
              {searchQuery ? 'Aucun utilisateur trouvé.' : 'Aucun utilisateur enregistré.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-umbrella-border">
                  <th className="text-left text-xs font-medium text-umbrella-text-secondary uppercase tracking-wider px-6 py-4">
                    Nom
                  </th>
                  <th className="text-left text-xs font-medium text-umbrella-text-secondary uppercase tracking-wider px-6 py-4">
                    Email
                  </th>
                  <th className="text-left text-xs font-medium text-umbrella-text-secondary uppercase tracking-wider px-6 py-4">
                    Rôle
                  </th>
                  <th className="text-left text-xs font-medium text-umbrella-text-secondary uppercase tracking-wider px-6 py-4">
                    Statut
                  </th>
                  <th className="text-right text-xs font-medium text-umbrella-text-secondary uppercase tracking-wider px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-umbrella-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-umbrella-bg-alt/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-umbrella-accent-light flex items-center justify-center">
                          <span className="text-xs font-medium text-umbrella-accent">
                            {user.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-umbrella-text">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-umbrella-text-light">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-umbrella-text-secondary">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs rounded font-medium ${
                          user.role === 'admin'
                            ? 'bg-umbrella-warm/10 text-umbrella-warm'
                            : 'bg-umbrella-accent-light text-umbrella-accent'
                        }`}
                      >
                        {user.role === 'admin' ? 'Administrateur' : 'Observateur'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center space-x-1.5 text-xs ${
                          user.active ? 'text-green-600' : 'text-umbrella-text-light'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.active ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <span>{user.active ? 'Actif' : 'Inactif'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-umbrella-text-light hover:text-umbrella-accent hover:bg-umbrella-accent-light rounded-lg transition-all duration-200"
                          aria-label="Modifier"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="p-2 text-umbrella-text-light hover:text-umbrella-warm hover:bg-umbrella-warm-light rounded-lg transition-all duration-200"
                          aria-label={user.active ? 'Désactiver' : 'Activer'}
                        >
                          {user.active ? (
                            <ToggleRight size={15} />
                          ) : (
                            <ToggleLeft size={15} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 text-umbrella-text-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                          aria-label="Supprimer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-umbrella-text">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-umbrella-text-light hover:text-umbrella-text transition-colors duration-200"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error */}
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="form-username"
                  className="block text-sm font-medium text-umbrella-text mb-1"
                >
                  Nom d'utilisateur
                </label>
                <input
                  id="form-username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  disabled={!!editingUser}
                  className="w-full px-3 py-2 border border-umbrella-border rounded-lg text-sm text-umbrella-text disabled:bg-umbrella-bg-alt disabled:text-umbrella-text-light focus:outline-none focus:ring-2 focus:ring-umbrella-accent/20 focus:border-umbrella-accent transition-all duration-300"
                  placeholder="Nom d'utilisateur"
                />
              </div>

              <div>
                <label
                  htmlFor="form-fullname"
                  className="block text-sm font-medium text-umbrella-text mb-1"
                >
                  Nom complet
                </label>
                <input
                  id="form-fullname"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-umbrella-border rounded-lg text-sm text-umbrella-text focus:outline-none focus:ring-2 focus:ring-umbrella-accent/20 focus:border-umbrella-accent transition-all duration-300"
                  placeholder="Nom complet"
                />
              </div>

              <div>
                <label
                  htmlFor="form-email"
                  className="block text-sm font-medium text-umbrella-text mb-1"
                >
                  Email
                </label>
                <input
                  id="form-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-umbrella-border rounded-lg text-sm text-umbrella-text focus:outline-none focus:ring-2 focus:ring-umbrella-accent/20 focus:border-umbrella-accent transition-all duration-300"
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label
                  htmlFor="form-role"
                  className="block text-sm font-medium text-umbrella-text mb-1"
                >
                  Rôle
                </label>
                <select
                  id="form-role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-umbrella-border rounded-lg text-sm text-umbrella-text focus:outline-none focus:ring-2 focus:ring-umbrella-accent/20 focus:border-umbrella-accent transition-all duration-300 bg-white"
                >
                  <option value="viewer">Observateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="form-password"
                  className="block text-sm font-medium text-umbrella-text mb-1"
                >
                  Mot de passe
                  {editingUser && (
                    <span className="text-umbrella-text-light font-normal ml-1">
                      (laisser vide pour ne pas changer)
                    </span>
                  )}
                </label>
                <input
                  id="form-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                  className="w-full px-3 py-2 border border-umbrella-border rounded-lg text-sm text-umbrella-text placeholder:text-umbrella-text-light focus:outline-none focus:ring-2 focus:ring-umbrella-accent/20 focus:border-umbrella-accent transition-all duration-300"
                  placeholder={
                    editingUser
                      ? 'Laisser vide pour conserver l\'actuel'
                      : 'Mot de passe'
                  }
                />
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-umbrella-accent text-white text-sm font-medium rounded-lg hover:bg-umbrella-accent/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {formLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>
                      {editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-umbrella-border text-umbrella-text-secondary text-sm rounded-lg hover:bg-umbrella-bg-alt transition-all duration-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

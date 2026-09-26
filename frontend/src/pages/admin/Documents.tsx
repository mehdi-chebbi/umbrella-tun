import { useEffect, useRef, useState, type FormEvent } from 'react';
import { FileText, FolderOpen, Loader2, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

interface DocumentItem {
  filename: string;
  title: string;
  size: string;
  sizeBytes: number;
  url: string;
}

interface DocumentCategory {
  category: string;
  documents: DocumentItem[];
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const DOCUMENT_CATEGORIES = [
  'Études & Caractérisation',
  'Rapports NDT & UNCCD',
  'Stratégies Nationales',
] as const;

export default function AdminDocuments() {
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [deletingKey, setDeletingKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/resources');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Impossible de charger les documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchDocuments();
  }, [isAdmin]);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleFileChange = (selectedFiles: FileList | null) => {
    resetMessages();
    if (!selectedFiles || selectedFiles.length === 0) {
      setFiles([]);
      return;
    }

    const nextFiles = Array.from(selectedFiles);
    const invalidFiles = nextFiles.filter(
      (selectedFile) => selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')
    );
    if (invalidFiles.length > 0) {
      setFiles([]);
      setError(`Seuls les fichiers PDF sont acceptés : ${invalidFiles.map((item) => item.name).join(', ')}`);
      return;
    }

    const oversizedFiles = nextFiles.filter((selectedFile) => selectedFile.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setFiles([]);
      setError(`Ces fichiers dépassent la limite de 25 Mo : ${oversizedFiles.map((item) => item.name).join(', ')}`);
      return;
    }

    setFiles(nextFiles);
  };

  const handleUpload = async (event: FormEvent) => {
    event.preventDefault();
    resetMessages();

    const normalizedCategory = category.trim();
    if (!normalizedCategory || files.length === 0) {
      setError('Choisissez une catégorie et au moins un fichier PDF.');
      return;
    }

    setUploading(true);
    setUploadProgress({ completed: 0, total: files.length });
    const failures: string[] = [];
    let uploadedCount = 0;

    for (const selectedFile of files) {
      try {
        await api.post(
          `/resources/admin/${encodeURIComponent(normalizedCategory)}/${encodeURIComponent(selectedFile.name)}`,
          selectedFile,
          { headers: { 'Content-Type': 'application/pdf' } }
        );
        uploadedCount += 1;
      } catch (err: any) {
        const reason = err.response?.data?.error || 'échec de l’envoi';
        failures.push(`${selectedFile.name} (${reason})`);
      } finally {
        setUploadProgress((progress) => ({ ...progress, completed: progress.completed + 1 }));
      }
    }

    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    await fetchDocuments();

    if (uploadedCount > 0) {
      setSuccess(`${uploadedCount} document${uploadedCount > 1 ? 's ajoutés' : ' ajouté'} avec succès.`);
    }
    if (failures.length > 0) {
      setError(`Certains documents n’ont pas été ajoutés : ${failures.join(' ; ')}`);
    }

    setUploading(false);
    setUploadProgress({ completed: 0, total: 0 });
  };

  const handleDelete = async (categoryName: string, document: DocumentItem) => {
    if (!window.confirm(`Supprimer « ${document.title} » ?`)) return;

    const key = `${categoryName}/${document.filename}`;
    resetMessages();
    try {
      setDeletingKey(key);
      await api.delete(
        `/resources/admin/${encodeURIComponent(categoryName)}/${encodeURIComponent(document.filename)}`
      );
      setSuccess('Document supprimé avec succès.');
      await fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Impossible de supprimer le document.');
    } finally {
      setDeletingKey('');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-umbrella-border rounded-lg p-8 text-center">
        <p className="text-sm text-umbrella-text-secondary">Droits administrateur requis.</p>
      </div>
    );
  }

  const documentCount = categories.reduce((total, item) => total + item.documents.length, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-umbrella-text">Documents</h1>
          <p className="text-sm text-umbrella-text-secondary mt-1">
            Gérez les PDF affichés dans la bibliothèque publique.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDocuments}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-umbrella-border rounded-lg text-sm font-medium text-umbrella-text hover:border-umbrella-accent/40 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {(error || success) && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg border text-sm ${
            error
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
          role="status"
        >
          {error || success}
        </div>
      )}

      <form onSubmit={handleUpload} className="bg-white border border-umbrella-border rounded-xl p-5 md:p-6 mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-umbrella-accent-light text-umbrella-accent">
            <Upload size={20} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-umbrella-text">Ajouter des documents</h2>
            <p className="text-xs text-umbrella-text-light mt-0.5">Sélection multiple autorisée, 25 Mo maximum par PDF.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] gap-4 lg:items-end">
          <div>
            <label htmlFor="document-category" className="block text-sm font-medium text-umbrella-text mb-2">
              Catégorie
            </label>
            <select
              id="document-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
              className="w-full px-3 py-2.5 border border-umbrella-border rounded-lg bg-white text-sm focus:ring-2 focus:ring-umbrella-accent/20 focus:border-umbrella-accent outline-none"
            >
              <option value="">Sélectionner une catégorie</option>
              {DOCUMENT_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="document-file" className="block text-sm font-medium text-umbrella-text mb-2">
              Fichiers PDF
            </label>
            <input
              ref={fileInputRef}
              id="document-file"
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={(event) => handleFileChange(event.target.files)}
              required
              className="block w-full text-sm text-umbrella-text-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:bg-umbrella-bg-alt file:text-umbrella-text file:font-medium hover:file:bg-gray-200 file:cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={uploading || files.length === 0 || !category.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-umbrella-dark text-white rounded-lg text-sm font-medium hover:bg-umbrella-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:translate-y-px"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {uploading
              ? `Ajout ${uploadProgress.completed}/${uploadProgress.total}`
              : files.length > 0
                ? `Ajouter ${files.length} document${files.length > 1 ? 's' : ''}`
                : 'Ajouter'}
          </button>
        </div>

        {files.length > 0 && !uploading && (
          <p className="mt-4 text-xs text-umbrella-text-secondary">
            {files.length} fichier{files.length > 1 ? 's sélectionnés' : ' sélectionné'} : {files.map((item) => item.name).join(', ')}
          </p>
        )}
      </form>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-umbrella-text">Bibliothèque</h2>
        <span className="text-xs text-umbrella-text-light">
          {documentCount} document{documentCount > 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="bg-white border border-umbrella-border rounded-xl p-12 text-center">
          <Loader2 size={26} className="animate-spin text-umbrella-accent mx-auto mb-3" />
          <p className="text-sm text-umbrella-text-secondary">Chargement des documents…</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-umbrella-border rounded-xl px-6 py-14 text-center">
          <FolderOpen size={38} strokeWidth={1.25} className="text-umbrella-border mx-auto mb-4" />
          <p className="text-sm font-medium text-umbrella-text">Aucun document</p>
          <p className="text-sm text-umbrella-text-light mt-1">Ajoutez le premier PDF avec le formulaire ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {categories.map((item) => (
            <section key={item.category} className="bg-white border border-umbrella-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-umbrella-bg-alt border-b border-umbrella-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FolderOpen size={18} strokeWidth={1.5} className="text-umbrella-accent" />
                  <h3 className="text-sm font-semibold text-umbrella-text">{item.category}</h3>
                </div>
                <span className="text-xs text-umbrella-text-light">{item.documents.length}</span>
              </div>

              <div className="divide-y divide-umbrella-border">
                {item.documents.map((document) => {
                  const key = `${item.category}/${document.filename}`;
                  return (
                    <div key={document.filename} className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3 min-w-0">
                        <FileText size={19} strokeWidth={1.5} className="text-umbrella-text-light mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-umbrella-text hover:text-umbrella-accent break-words"
                          >
                            {document.title}
                          </a>
                          <p className="text-xs text-umbrella-text-light mt-1 break-all">
                            {document.filename} · {document.size}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.category, document)}
                        disabled={deletingKey === key}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors sm:self-center"
                      >
                        {deletingKey === key ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        Supprimer
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

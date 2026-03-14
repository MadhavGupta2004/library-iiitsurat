import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { HiOutlinePhotograph, HiOutlineUpload } from 'react-icons/hi';

const EditBook = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        totalCopies: 1,
        rackLocation: '',
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const res = await api.get(`/books/${id}`);
                const { title, author, isbn, totalCopies, rackLocation, image } = res.data;
                setFormData({ title, author, isbn, totalCopies, rackLocation });
                if (image) setPreview(image);
            } catch (err) {
                toast.error('Failed to load book');
                navigate('/librarian/books');
            } finally {
                setFetching(false);
            }
        };
        fetchBook();
    }, [id, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach((key) => data.append(key, formData[key]));
            if (image) data.append('image', image);

            await api.put(`/books/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Book updated successfully!');
            navigate('/librarian/books');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update book');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl">
                <h1 className="page-title mb-6">Edit Book</h1>

                <div className="card p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Book Cover Image
                            </label>
                            <div className="flex items-start gap-4">
                                <div className="w-28 h-36 bg-surface-100 dark:bg-surface-700 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 flex items-center justify-center overflow-hidden">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <HiOutlinePhotograph className="w-8 h-8 text-surface-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer text-sm">
                                        <HiOutlineUpload className="w-4 h-4" />
                                        Change Image
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Title *</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required className="input-field" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Author *</label>
                            <input type="text" name="author" value={formData.author} onChange={handleChange} required className="input-field" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">ISBN *</label>
                                <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} required className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Total Copies *</label>
                                <input type="number" name="totalCopies" value={formData.totalCopies} onChange={handleChange} required min="1" className="input-field" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Rack Location *</label>
                            <input type="text" name="rackLocation" value={formData.rackLocation} onChange={handleChange} required className="input-field" />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={loading} className="btn-primary flex-1">
                                {loading ? 'Updating...' : 'Update Book'}
                            </button>
                            <button type="button" onClick={() => navigate('/librarian/books')} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default EditBook;

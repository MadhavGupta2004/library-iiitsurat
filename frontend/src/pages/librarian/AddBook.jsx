import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import toast from 'react-hot-toast';
import { HiOutlinePhotograph, HiOutlineUpload } from 'react-icons/hi';

const AddBook = () => {
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
    const navigate = useNavigate();

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

            await api.post('/books', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Book added successfully!');
            navigate('/librarian/books');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add book');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl">
                <h1 className="page-title mb-6">Add New Book</h1>

                <div className="card p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Image Upload */}
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
                                        Upload Image
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-xs text-surface-400 mt-2">JPG, PNG or WebP. Max 5MB.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Enter book title"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Author *
                            </label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                required
                                placeholder="Enter author name"
                                className="input-field"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    ISBN *
                                </label>
                                <input
                                    type="text"
                                    name="isbn"
                                    value={formData.isbn}
                                    onChange={handleChange}
                                    required
                                    placeholder="978-3-16-148410-0"
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    Total Copies *
                                </label>
                                <input
                                    type="number"
                                    name="totalCopies"
                                    value={formData.totalCopies}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Rack Location *
                            </label>
                            <input
                                type="text"
                                name="rackLocation"
                                value={formData.rackLocation}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Section A, Shelf 3"
                                className="input-field"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={loading} className="btn-primary flex-1">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Adding...
                                    </span>
                                ) : (
                                    'Add Book'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/librarian/books')}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AddBook;

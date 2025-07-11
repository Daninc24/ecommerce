import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PhotoIcon } from '@heroicons/react/24/outline';

const emptyAdvert = {
  title: '',
  message: '',
  product: '',
  image: '',
  startDate: '',
  endDate: '',
  active: true,
};

const advertTemplates = [
  {
    id: 'classic',
    name: 'Classic',
    render: ({ title, message, image, product }) => (
      <div className="border rounded p-4 bg-white flex gap-4 items-center">
        {image && <img src={image} alt="Advert" className="w-24 h-24 object-cover rounded" />}
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-gray-700">{message}</p>
          <div className="text-xs text-gray-500 mt-2">{product}</div>
        </div>
      </div>
    )
  },
  {
    id: 'banner',
    name: 'Banner',
    render: ({ title, message, image }) => (
      <div className="relative h-32 flex items-center justify-center bg-blue-100 rounded overflow-hidden">
        {image && <img src={image} alt="Advert" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
        <div className="relative z-10 text-center">
          <h2 className="text-2xl font-bold text-blue-900 drop-shadow">{title}</h2>
          <p className="text-blue-800 mt-1">{message}</p>
        </div>
      </div>
    )
  },
  {
    id: 'card',
    name: 'Card',
    render: ({ title, message, image }) => (
      <div className="bg-gradient-to-br from-pink-100 to-yellow-100 rounded-lg p-4 flex flex-col items-center">
        {image && <img src={image} alt="Advert" className="w-20 h-20 object-cover rounded-full mb-2" />}
        <h2 className="text-lg font-bold text-pink-700">{title}</h2>
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    )
  },
  {
    id: 'left-image',
    name: 'Left Image Banner',
    render: ({ title, message, image, product }) => (
      <div className="flex items-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-4 gap-4">
        {image && <img src={image} alt="Advert" className="w-28 h-28 object-cover rounded-lg shadow-lg" />}
        <div>
          <h2 className="text-2xl font-bold mb-1">{title}</h2>
          <p className="text-white mb-2">{message}</p>
          {product && <span className="text-xs bg-white/20 px-2 py-1 rounded">{product}</span>}
        </div>
      </div>
    )
  },
  {
    id: 'cta-card',
    name: 'CTA Card',
    render: ({ title, message, image, product }) => (
      <div className="bg-white border-2 border-pink-400 rounded-xl p-6 flex flex-col items-center shadow-md">
        {image && <img src={image} alt="Advert" className="w-24 h-24 object-cover rounded-full border-4 border-pink-200 mb-2" />}
        <h2 className="text-xl font-bold text-pink-700 mb-1">{title}</h2>
        <p className="text-gray-700 mb-2">{message}</p>
        {product && <span className="text-xs text-pink-600 mb-2">{product}</span>}
        <button className="bg-pink-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-pink-600 transition">Shop Now</button>
      </div>
    )
  },
];

const AdminAdverts = () => {
  const [adverts, setAdverts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyAdvert);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [template, setTemplate] = useState('classic');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchAdverts();
    fetchProducts();
  }, []);

  const fetchAdverts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/adverts/all');
      setAdverts(res.data.adverts || []);
    } catch {
      setAdverts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      setProducts(Array.isArray(res.data) ? res.data : (res.data.products || []));
    } catch {
      setProducts([]);
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
    else setImagePreview('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('message', form.message);
      data.append('product', form.product);
      data.append('startDate', form.startDate);
      data.append('endDate', form.endDate);
      data.append('active', form.active);
      data.append('template', template);
      if (imageFile) data.append('image', imageFile);
      else if (form.image) data.append('image', form.image);
      if (editingId) {
        await axios.put(`/api/adverts/${editingId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('Advert updated!');
      } else {
        await axios.post('/api/adverts', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMsg('Advert created!');
      }
      setForm(emptyAdvert);
      setEditingId(null);
      setImageFile(null);
      setImagePreview('');
      fetchAdverts();
    } catch (err) {
      setMsg('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = advert => {
    setForm({
      ...advert,
      product: advert.product?._id || advert.product,
      startDate: advert.startDate ? advert.startDate.slice(0, 10) : '',
      endDate: advert.endDate ? advert.endDate.slice(0, 10) : '',
    });
    setEditingId(advert._id);
    setTemplate(advert.template || 'classic');
    setImageFile(null);
    setImagePreview(advert.image || '');
    setMsg('');
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this advert?')) return;
    setMsg('');
    try {
      await axios.delete(`/api/adverts/${id}`);
      setMsg('Advert deleted!');
      fetchAdverts();
    } catch (err) {
      setMsg('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Manage Product Adverts</h1>
      {msg && <div className="mb-2 text-green-700">{msg}</div>}
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4" encType="multipart/form-data">
        <input name="title" value={form.title} onChange={handleChange} placeholder="Advert Title" className="border rounded px-2 py-1" required />
        <input name="message" value={form.message} onChange={handleChange} placeholder="Message" className="border rounded px-2 py-1" required />
        <div className="flex flex-col gap-1">
          <label className="font-medium">Product</label>
          <input
            type="text"
            placeholder="Search product..."
            value={productSearch}
            onChange={e => setProductSearch(e.target.value)}
            className="border rounded px-2 py-1 mb-1"
          />
          <select
            name="product"
            value={form.product}
            onChange={handleChange}
            className="border rounded px-2 py-1"
            required
          >
            <option value="">Select Product</option>
            {products
              .filter(p => p.title?.toLowerCase().includes(productSearch.toLowerCase()) || p.name?.toLowerCase().includes(productSearch.toLowerCase()))
              .map(p => (
                <option key={p._id} value={p._id}>
                  {p.title || p.name}
                </option>
              ))}
          </select>
          {form.product && (
            <div className="flex items-center gap-2 mt-1">
              {products.find(p => p._id === form.product)?.image && (
                <img src={products.find(p => p._id === form.product)?.image} alt="Product" className="w-10 h-10 object-cover rounded" />
              )}
              <span className="text-sm text-gray-700">{products.find(p => p._id === form.product)?.title || products.find(p => p._id === form.product)?.name}</span>
            </div>
          )}
        </div>
        <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL (optional)" className="border rounded px-2 py-1" />
        <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className="border rounded px-2 py-1" required />
        <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className="border rounded px-2 py-1" required />
        <label className="flex items-center gap-2">
          <input name="active" type="checkbox" checked={form.active} onChange={handleChange} /> Active
        </label>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <div className="mt-2"><img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded" /></div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-medium">Template</label>
          <select value={template} onChange={e => setTemplate(e.target.value)} className="border rounded px-2 py-1">
            {advertTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="font-medium mb-1 block">Live Preview</label>
          {advertTemplates.find(t => t.id === template)?.render({
            title: form.title,
            message: form.message,
            image: imagePreview || form.image,
            product: products.find(p => p._id === form.product)?.title || ''
          })}
        </div>
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 col-span-1 md:col-span-2">
          {editingId ? 'Update Advert' : 'Create Advert'}
        </button>
        {editingId && (
          <button type="button" className="bg-gray-400 text-white rounded px-4 py-2 col-span-1 md:col-span-2" onClick={() => { setForm(emptyAdvert); setEditingId(null); }}>Cancel Edit</button>
        )}
      </form>
      <h2 className="text-lg font-semibold mb-2">All Adverts</h2>
      {loading ? <div>Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Title</th>
                <th>Product</th>
                <th>Active</th>
                <th>Start</th>
                <th>End</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adverts.map(ad => (
                <tr key={ad._id} className="border-t">
                  <td className="p-2">{ad.title}</td>
                  <td>{ad.product?.title || ad.product?.name || ad.product}</td>
                  <td>{ad.active ? 'Yes' : 'No'}</td>
                  <td>{ad.startDate ? ad.startDate.slice(0, 10) : ''}</td>
                  <td>{ad.endDate ? ad.endDate.slice(0, 10) : ''}</td>
                  <td>
                    <button className="px-2 py-1 bg-blue-500 text-white rounded text-xs mr-1" onClick={() => handleEdit(ad)}>Edit</button>
                    <button className="px-2 py-1 bg-red-500 text-white rounded text-xs" onClick={() => handleDelete(ad._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {adverts.length === 0 && (
                <tr><td colSpan="6" className="text-center py-2 text-gray-500">No adverts found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAdverts; 
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/Spinner';

const VACANCY_API = 'http://localhost:5002/api/vacancies';

export default function Vacancies() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [error, setError] = useState('');

  const isExpired = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(VACANCY_API);
        const data = await res.json();

        if (!Array.isArray(data)) {
          setVacancies([]);
          setError('Invalid vacancy data received.');
          return;
        }

        const visibleVacancies = data.filter((v) => !isExpired(v.deadline));
        setVacancies(visibleVacancies);
      } catch (err) {
        console.error('Failed to fetch vacancies', err);
        setVacancies([]);
        setError('Failed to fetch vacancies.');
      } finally {
        setLoading(false);
      }
    };

    fetchVacancies();
  }, []);

  const openVacancyDetails = async (vacancy) => {
    try {
      const res = await fetch(`${VACANCY_API}/${vacancy._id}/view`, {
        method: 'PATCH'
      });

      const data = await res.json();

      if (res.ok) {
        setVacancies((prev) =>
          prev.map((v) => (v._id === vacancy._id ? data : v))
        );
        setSelectedVacancy(data);
      } else {
        setSelectedVacancy(vacancy);
      }
    } catch (err) {
      console.error('Failed to update vacancy view count', err);
      setSelectedVacancy(vacancy);
    }
  };

  const jobTypeColor = (type) => {
    if (type === 'Full-time') {
      return 'bg-green-100 text-green-700 border border-green-200';
    }
    if (type === 'Part-time') {
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    }
    return 'bg-blue-100 text-blue-700 border border-blue-200';
  };

  const filtered = vacancies.filter((v) => {
    const title = v.title?.toLowerCase() || '';
    const company = v.company?.toLowerCase() || '';
    const term = search.toLowerCase();

    const matchSearch = title.includes(term) || company.includes(term);
    const matchFilter = filter === 'All' || v.jobType === filter;

    return matchSearch && matchFilter;
  });

  const totalCount = vacancies.length;
  const internshipCount = vacancies.filter(
    (v) => v.jobType === 'Internship' || !v.jobType
  ).length;
  const fullTimeCount = vacancies.filter((v) => v.jobType === 'Full-time').length;
  const partTimeCount = vacancies.filter((v) => v.jobType === 'Part-time').length;

  const getShortDescription = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  if (loading) return <Spinner message="Loading vacancies..." />;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-3xl p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center transition-all"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Vacancy"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {selectedVacancy && (
        <div
          className="fixed inset-0 bg-black/60 z-50 p-4 overflow-y-auto"
          onClick={() => setSelectedVacancy(null)}
        >
          <div className="min-h-full flex items-center justify-center py-6">
            <div
              className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-gray-100 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedVacancy(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg"
              >
                ✕
              </button>

              <div className="pr-12">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${jobTypeColor(
                      selectedVacancy.jobType
                    )}`}
                  >
                    {selectedVacancy.jobType || 'Internship'}
                  </span>

                  {selectedVacancy.deadline && (
                    <span className="text-xs text-gray-400">
                      ⏰ {new Date(selectedVacancy.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {selectedVacancy.title}
                </h2>
                <p className="text-blue-700 font-medium text-sm mb-1">
                  🏢 {selectedVacancy.company}
                </p>
                <p className="text-gray-500 text-sm mb-1">
                  📍 {selectedVacancy.location}
                </p>
                <p className="text-gray-400 text-xs mb-4">
                  👁️ {selectedVacancy.viewCount || 0} views
                </p>

                {selectedVacancy.salary && (
                  <div className="mb-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                      💰 {selectedVacancy.salary}
                    </span>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Job Summary
                  </p>
                  <p className="text-sm text-gray-600 leading-7 whitespace-pre-line">
                    {selectedVacancy.description || 'No job summary available.'}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                    Company
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedVacancy.company || 'No company name available.'}
                  </p>
                </div>

                {selectedVacancy.skills?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Required Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedVacancy.skills.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs border border-gray-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Application URL
                  </p>

                  {selectedVacancy.applicationUrl ? (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                      <p className="text-sm text-gray-700 break-all mb-4">
                        {selectedVacancy.applicationUrl}
                      </p>

                      <Link
                        to={`/student/apply/${selectedVacancy._id}`}
                        className="inline-flex items-center justify-center w-full py-3.5 bg-gradient-to-r from-blue-800 to-orange-600 hover:from-blue-900 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg"
                      >
                        Proceed to Application
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                      <p className="text-sm text-red-600">
                        Application URL is not available for this vacancy.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">💼 Internship Vacancies</h1>
        <p className="text-gray-500 mt-1">
          Discover and apply for your next great opportunity.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-orange-600 flex items-center justify-center text-white text-3xl shadow-lg">
                💼
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Vacancy Hub</h2>
                <p className="text-gray-500 text-sm">
                  Browse available internship opportunities
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full xl:w-auto">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 min-w-[130px]">
                <p className="text-xs text-blue-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-800">{totalCount}</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 min-w-[130px]">
                <p className="text-xs text-indigo-600 font-medium">Internships</p>
                <p className="text-2xl font-bold text-indigo-700">{internshipCount}</p>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 min-w-[130px]">
                <p className="text-xs text-green-600 font-medium">Full-time</p>
                <p className="text-2xl font-bold text-green-700">{fullTimeCount}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3 min-w-[130px]">
                <p className="text-xs text-yellow-700 font-medium">Part-time</p>
                <p className="text-2xl font-bold text-yellow-700">{partTimeCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Vacancies
              </label>
              <input
                type="text"
                placeholder="Search by title or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All</option>
                <option>Internship</option>
                <option>Full-time</option>
                <option>Part-time</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Available Opportunities</h2>
            <p className="text-gray-500 text-sm mt-1">
              {filtered.length} vacancy{filtered.length !== 1 ? 'ies' : ''} found
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
              Search: {search ? `"${search}"` : 'All'}
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
              Filter: {filter}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-4xl">
              💼
            </div>
            <p className="text-lg font-semibold text-gray-600">No vacancies found</p>
            <p className="text-sm mt-1">
              Try adjusting your search term or job type filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((vacancy) => (
              <div
                key={vacancy._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-100 transition-all h-full flex flex-col"
              >
                {vacancy.imageUrl ? (
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(vacancy.imageUrl)}
                  >
                    <img
                      src={vacancy.imageUrl}
                      alt={vacancy.company}
                      className="w-full h-52 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                      <span className="text-white text-sm font-semibold bg-black/40 px-4 py-2 rounded-full">
                        🔍 View Full Image
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-52 bg-gradient-to-br from-blue-800 to-orange-600 flex items-center justify-center">
                    <span className="text-6xl">💼</span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${jobTypeColor(
                        vacancy.jobType
                      )}`}
                    >
                      {vacancy.jobType || 'Internship'}
                    </span>

                    {vacancy.deadline && (
                      <span className="text-gray-400 text-xs shrink-0">
                        ⏰ {new Date(vacancy.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 mb-1">{vacancy.title}</h3>
                  <p className="text-blue-700 font-medium text-sm mb-1">
                    🏢 {vacancy.company}
                  </p>
                  <p className="text-gray-500 text-sm mb-1">📍 {vacancy.location}</p>
                  <p className="text-gray-400 text-xs mb-3">
                    👁️ {vacancy.viewCount || 0} views
                  </p>

                  {vacancy.salary && (
                    <div className="mb-3">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                        💰 {vacancy.salary}
                      </span>
                    </div>
                  )}

                  <div className="mb-4 p-4 bg-gray-50 border border-gray-100 rounded-xl min-h-[112px]">
                    <p className="text-sm text-gray-600 leading-6">
                      {getShortDescription(vacancy.description, 120)}
                    </p>

                    {vacancy.description && vacancy.description.length > 120 && (
                      <button
                        type="button"
                        onClick={() => openVacancyDetails(vacancy)}
                        className="mt-2 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        See more
                      </button>
                    )}
                  </div>

                  <div className="mb-5 min-h-[68px]">
                    {vacancy.skills?.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Required Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {vacancy.skills.slice(0, 4).map((skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs border border-gray-200"
                            >
                              {skill}
                            </span>
                          ))}
                          {vacancy.skills.length > 4 && (
                            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs border border-orange-200">
                              +{vacancy.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-auto">
                    <Link
                      to={`/student/apply/${vacancy._id}`}
                      className={`inline-flex items-center justify-center w-full py-3.5 bg-gradient-to-r from-blue-800 to-orange-600 hover:from-blue-900 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg ${isExpired(vacancy.deadline) ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {isExpired(vacancy.deadline) ? 'Expired' : '🚀 Apply Now'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
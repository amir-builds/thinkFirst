import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:8000/api/v1";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    category: "DSA"
  });
  
  const [testCases, setTestCases] = useState([
    { input: "", output: "" }
  ]);

  useEffect(() => {
    fetchAdminData();
    fetchQuestions();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/current`, {
        withCredentials: true
      });
      setAdmin(response.data.data.admin);
    } catch (error) {
      toast.error("Please login first");
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/questions/all`, {
        withCredentials: true
      });
      setQuestions(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/admin/logout`, {}, { withCredentials: true });
      toast.success("Logged out successfully");
      navigate("/admin/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const questionData = {
        ...formData,
        sample_input1: testCases[0]?.input || null,
        sample_output1: testCases[0]?.output || null,
        sample_input2: testCases[1]?.input || null,
        sample_output2: testCases[1]?.output || null,
        sample_input3: testCases[2]?.input || null,
        sample_output3: testCases[2]?.output || null,
      };
      
      await axios.post(`${API_BASE_URL}/questions/create`, questionData, {
        withCredentials: true
      });
      toast.success("Question added successfully");
      setShowAddQuestion(false);
      fetchQuestions();
      resetForm();
    } catch (error) {
      toast.error("Failed to add question");
    }
  };

  const handleEditQuestion = async (e) => {
    e.preventDefault();
    try {
      const questionData = {
        ...formData,
        sample_input1: testCases[0]?.input || null,
        sample_output1: testCases[0]?.output || null,
        sample_input2: testCases[1]?.input || null,
        sample_output2: testCases[1]?.output || null,
        sample_input3: testCases[2]?.input || null,
        sample_output3: testCases[2]?.output || null,
      };
      
      await axios.put(`${API_BASE_URL}/questions/update/${editingQuestion.id}`, questionData, {
        withCredentials: true
      });
      toast.success("Question updated successfully");
      setEditingQuestion(null);
      fetchQuestions();
      resetForm();
    } catch (error) {
      toast.error("Failed to update question");
    }
  };

  const startEditing = (question) => {
    setEditingQuestion(question);
    setFormData({
      title: question.title,
      description: question.description,
      difficulty: question.difficulty,
      category: question.category
    });
    
    const cases = [];
    if (question.sample_input1 && question.sample_output1) {
      cases.push({ input: question.sample_input1, output: question.sample_output1 });
    }
    if (question.sample_input2 && question.sample_output2) {
      cases.push({ input: question.sample_input2, output: question.sample_output2 });
    }
    if (question.sample_input3 && question.sample_output3) {
      cases.push({ input: question.sample_input3, output: question.sample_output3 });
    }
    if (cases.length === 0) {
      cases.push({ input: "", output: "" });
    }
    setTestCases(cases);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      difficulty: "Easy",
      category: "DSA"
    });
    setTestCases([{ input: "", output: "" }]);
  };

  const cancelEdit = () => {
    setEditingQuestion(null);
    resetForm();
  };

  const addTestCase = () => {
    if (testCases.length < 3) {
      setTestCases([...testCases, { input: "", output: "" }]);
    } else {
      toast.error("Maximum 3 test cases allowed");
    }
  };

  const removeTestCase = (index) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleTogglePublic = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/questions/toggle-public/${id}`, {}, {
        withCredentials: true
      });
      toast.success("Question visibility updated");
      fetchQuestions();
    } catch (error) {
      toast.error("Failed to update question");
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await axios.delete(`${API_BASE_URL}/questions/delete/${id}`, {
          withCredentials: true
        });
        toast.success("Question deleted");
        fetchQuestions();
      } catch (error) {
        toast.error("Failed to delete question");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Welcome, {admin?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Questions</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{questions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Public Questions</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {questions.filter(q => q.is_public).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Draft Questions</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {questions.filter(q => !q.is_public).length}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddQuestion(!showAddQuestion)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            {showAddQuestion ? "Cancel" : "+ Add New Question"}
          </button>
        </div>

        {/* Add/Edit Question Form */}
        {(showAddQuestion || editingQuestion) && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingQuestion ? "Edit Question" : "Add New Question"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddQuestion(false);
                  cancelEdit();
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={editingQuestion ? handleEditQuestion : handleAddQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option>DSA</option>
                    <option>SQL</option>
                  </select>
                </div>
              </div>

              {/* Test Cases */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">Test Cases</label>
                  <button
                    type="button"
                    onClick={addTestCase}
                    disabled={testCases.length >= 3}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    + Add Test Case
                  </button>
                </div>

                {testCases.map((testCase, index) => (
                  <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Test Case {index + 1}</h4>
                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(index)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Input</label>
                        <input
                          type="text"
                          value={testCase.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          placeholder="e.g., [2,7,11,15], 9"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Expected Output</label>
                        <input
                          type="text"
                          value={testCase.output}
                          onChange={(e) => updateTestCase(index, 'output', e.target.value)}
                          placeholder="e.g., [0,1]"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                {editingQuestion ? "Update Question" : "Add Question"}
              </button>
            </form>
          </div>
        )}

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {questions.map((question) => (
                <tr key={question.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{question.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {question.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      question.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {question.is_public ? 'Public' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => startEditing(question)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleTogglePublic(question.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      {question.is_public ? 'Hide' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

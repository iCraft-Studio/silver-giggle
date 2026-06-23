import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, 
  Search, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ArrowDownLeft,
  Filter,
  Smartphone,
  Users,
  Gift,
  ShoppingBag
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Order {
  id: string
  type: string
  status: string
  total_amount: number
  currency: string
  created_at: string
  metadata: any
}

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  const getStatusUI = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { 
          icon: <CheckCircle2 className="w-4 h-4" />, 
          class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' 
        }
      case 'pending':
        return { 
          icon: <Clock className="w-4 h-4" />, 
          class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' 
        }
      case 'failed':
        return { 
          icon: <XCircle className="w-4 h-4" />, 
          class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800' 
        }
      default:
        return { 
          icon: <AlertCircle className="w-4 h-4" />, 
          class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700' 
        }
    }
  }

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'virtual_number': return <Smartphone className="w-5 h-5" />;
      case 'social_account': return <Users className="w-5 h-5" />;
      case 'gift_purchase': return <Gift className="w-5 h-5" />;
      case 'wallet_topup': return <ArrowDownLeft className="w-5 h-5" />;
      default: return <ShoppingBag className="w-5 h-5" />;
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || order.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header (Always Visible) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Order History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your purchases and wallet transactions.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary w-full sm:w-64 transition-all"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-gray-700 dark:text-gray-300 transition-all"
            >
              <option value="all">All Types</option>
              <option value="virtual_number">Virtual Numbers</option>
              <option value="social_account">Social Accounts</option>
              <option value="gift_purchase">Gift Orders</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table/List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
              <tr>
                <th className="p-5 font-semibold">Service</th>
                <th className="p-5 font-semibold">Order ID</th>
                <th className="p-5 font-semibold">Date</th>
                <th className="p-5 font-semibold">Amount</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              
              {/* TARGETED SKELETON LOADER */}
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700/50 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="p-5"><div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="p-5"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="p-5"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                    <td className="p-5"><div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const ui = getStatusUI(order.status)
                  return (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={order.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            order.type === 'wallet_topup' ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' : 'bg-primary/10 text-primary dark:text-primary-400'
                          }`}>
                            {getServiceIcon(order.type)}
                          </div>
                          <div>
                            <span className="block font-bold text-gray-900 dark:text-white capitalize">
                              {order.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {order.metadata?.service || order.metadata?.source || 'Kodera Service'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 font-mono text-xs text-gray-500">#{order.id.slice(0, 8)}...</td>
                      <td className="p-5 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-5">
                        <span className={`font-bold ${order.type === 'wallet_topup' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                          {order.type === 'wallet_topup' ? '+' : '-'}{formatMoney(order.total_amount)}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${ui.class}`}>
                          {ui.icon}
                          <span className="capitalize">{order.status}</span>
                        </div>
                      </td>
                      <td className="p-5 text-right">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-primary dark:hover:text-primary-400 transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      <p>No orders found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
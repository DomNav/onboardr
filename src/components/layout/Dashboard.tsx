import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BarChart3, TrendingDown, TrendingUp, Wallet2, DollarSign, Users } from 'lucide-react';

export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const handleViewAllPools = () => {
    navigate('/pools'); // Navigate to DeFi pools page
  };

  const handlePortfolioAnalytics = () => {
    navigate('/portfolio'); // Navigate to portfolio page
  };

  // Mock stats data for demonstration
  const stats = [
    {
      title: "Total TVL",
      value: "$91.35M",
      change: "+2.4%",
      trend: "positive",
      icon: <Wallet2 className="h-4 w-4" />
    },
    {
      title: "24h Volume",
      value: "$8.31M",
      change: "+15.3%",
      trend: "positive",
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      title: "Active Pools",
      value: "24",
      change: "+3",
      trend: "positive",
      icon: <DollarSign className="h-4 w-4" />
    },
    {
      title: "Active Users",
      value: "1,247",
      change: "+8.1%",
      trend: "positive",
      icon: <Users className="h-4 w-4" />
    }
  ];

  const topPools = [
    { symbol: "SORO/USDC", apr: "12.8%", tvl: "$5.2M", change: "+2.1%" },
    { symbol: "DFX/USDT", apr: "8.4%", tvl: "$3.1M", change: "-0.6%" },
    { symbol: "ETH/USDC", apr: "6.2%", tvl: "$8.9M", change: "+1.3%" },
    { symbol: "xUSDL/SORO", apr: "15.1%", tvl: "$2.4M", change: "+4.2%" }
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-primary">
      <Navbar />
      
      <div className="flex-1 flex">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        
        <main className="flex-1 transition-all duration-300">
          <div className="container max-w-full p-4 lg:p-6 animate-fade-in">
            <div className="mb-6">
              <h1 className="text-3xl font-bold gradient-text mb-2 animate-float-gentle">
                Market Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome to your DeFi trading hub powered by Soroswap
              </p>
            </div>
            
            {/* Stats Row with enhanced Soroswap styling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-slide-up">
              {stats.map((stat, index) => (
                <Card 
                  key={stat.title}
                  className="bg-gradient-secondary shadow-soroswap-light dark:shadow-soroswap-dark card-hover-effect"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className="text-muted-foreground">{stat.icon}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center text-xs text-success">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>{stat.change}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Pools */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-gradient-secondary shadow-soroswap-light dark:shadow-soroswap-dark card-hover-effect">
                  <CardHeader>
                    <CardTitle className="gradient-text">Top Performing Pools</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topPools.map((pool, index) => (
                        <div 
                          key={pool.symbol}
                          className="flex items-center justify-between p-4 rounded-lg bg-gradient-accent/20 dark:bg-gradient-accent-dark/20 hover:bg-gradient-accent/30 dark:hover:bg-gradient-accent-dark/30 transition-colors"
                        >
                          <div>
                            <div className="font-semibold">{pool.symbol}</div>
                            <div className="text-sm text-muted-foreground">TVL: {pool.tvl}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{pool.apr}</div>
                            <div className={`text-xs flex items-center ${
                              pool.change.startsWith('+') ? 'text-success' : 'text-danger'
                            }`}>
                              {pool.change.startsWith('+') ? 
                                <TrendingUp className="h-3 w-3 mr-1" /> : 
                                <TrendingDown className="h-3 w-3 mr-1" />
                              }
                              {pool.change}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Chart Placeholder */}
                <Card className="bg-gradient-secondary shadow-soroswap-light dark:shadow-soroswap-dark card-hover-effect">
                  <CardHeader>
                    <CardTitle className="gradient-text">Market Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gradient-accent/10 dark:bg-gradient-accent-dark/10 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-white animate-glow-pulse" />
                        <p className="text-muted-foreground">Market Chart Coming Soon</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-4">
                <Card className="bg-gradient-secondary shadow-soroswap-light dark:shadow-soroswap-dark card-hover-effect">
                  <CardHeader>
                    <CardTitle className="gradient-text">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-gradient-accent hover:bg-gradient-accent/90 text-white shadow-soroswap-accent">
                      Connect Wallet
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-primary/20 hover:bg-primary/10"
                      onClick={handleViewAllPools}
                    >
                      View All Pools
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-primary/20 hover:bg-primary/10"
                      onClick={handlePortfolioAnalytics}
                    >
                      Portfolio Analytics
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-secondary shadow-soroswap-light dark:shadow-soroswap-dark card-hover-effect">
                  <CardHeader>
                    <CardTitle className="gradient-text">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SORO/USDC</span>
                        <span className="text-success">+$124.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">DFX/USDT</span>
                        <span className="text-success">+$89.32</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ETH/USDC</span>
                        <span className="text-danger">-$45.18</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}

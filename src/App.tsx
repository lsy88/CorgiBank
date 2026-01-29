import React, { useState } from 'react';
import { Layout, Menu, Typography, theme } from 'antd';
import { 
  UserOutlined, 
  ShopOutlined, 
  FormOutlined, 
  BarChartOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useData } from './useData';
import { EmployeeManager } from './components/EmployeeManager';
import { ProductManager } from './components/ProductManager';
import { MaterialManager } from './components/MaterialManager';
import { BatchManager } from './components/BatchManager';
import { SalaryReport } from './components/SalaryReport';
import { Dashboard } from './components/Dashboard';
import { LossManager } from './components/LossManager';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  
  const { 
    data, loading, 
    addEmployee, updateEmployee, deleteEmployee,
    addProduct, updateProduct, deleteProduct,
    addMaterial, updateMaterial, deleteMaterial,
    addBatch, updateBatch, deleteBatch,
    addLoss, updateLoss, deleteLoss,
    openDataFolder
  } = useData();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const menuItems = [
    { key: 'dashboard', icon: <HomeOutlined />, label: '经营概览' },
    { key: 'batches', icon: <FormOutlined />, label: '生产批次' },
    { key: 'employees', icon: <UserOutlined />, label: '员工管理' },
    { key: 'products', icon: <ShopOutlined />, label: '产品管理' },
    { key: 'materials', icon: <ShopOutlined />, label: '原料管理' },
    { key: 'losses', icon: <ExclamationCircleOutlined />, label: '损耗管理' },
    { key: 'reports', icon: <BarChartOutlined />, label: '工资报表' },
  ];

  if (loading) {
    return <div style={{ padding: 20 }}>正在加载数据...</div>;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard data={data} onNavigate={setCurrentView} />;
      case 'employees':
        return <EmployeeManager employees={data.employees} onAdd={addEmployee} onUpdate={updateEmployee} onDelete={deleteEmployee} />;
      case 'products':
        return <ProductManager products={data.products} onAdd={addProduct} onUpdate={updateProduct} onDelete={deleteProduct} />;
      case 'materials':
        return <MaterialManager materials={data.materials} onAdd={addMaterial} onUpdate={updateMaterial} onDelete={deleteMaterial} />;
      case 'batches':
        return <BatchManager data={data} onAdd={addBatch} onUpdate={updateBatch} onDelete={deleteBatch} />;
      case 'losses':
        return <LossManager data={data} onAdd={addLoss} onUpdate={updateLoss} onDelete={deleteLoss} />;
      case 'reports':
        return <SalaryReport data={data} />;
      default:
        return <div>Select a menu item</div>;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
           <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: 'white', lineHeight: '32px', overflow: 'hidden', whiteSpace: 'nowrap', flexShrink: 0 }}>
             {collapsed ? '管家' : '柯基记账'}
           </div>
           <Menu 
             theme="dark" 
             selectedKeys={[currentView]} 
             mode="inline" 
             items={menuItems} 
             onClick={({ key }) => setCurrentView(key)}
             style={{ flex: 1, overflowY: 'auto', borderRight: 0 }}
           />
           <div style={{ padding: '16px 0', width: '100%', textAlign: 'center', flexShrink: 0 }}>
             <div 
               style={{ 
                 color: 'rgba(255, 255, 255, 0.85)', 
                 cursor: 'pointer', 
                 fontSize: 14,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 gap: 8
               }}
               onClick={openDataFolder}
               title="点击打开数据文件夹"
             >
               <FolderOpenOutlined />
               {!collapsed && <span>打开数据位置</span>}
             </div>
           </div>
         </div>
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
                {menuItems.find(i => i.key === currentView)?.label}
            </Title>
        </Header>
        <Content style={{ margin: '16px 16px' }}>
          <div
            style={{
              minHeight: 360,
            }}
          >
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;

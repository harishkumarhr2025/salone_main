import React from 'react';
import Menuitems from './MenuItems';
import { useLocation } from 'react-router';
import { useSelector } from 'react-redux';
import { Box, List } from '@mui/material';
import NavItem from './NavItem';
import NavGroup from './NavGroup/NavGroup';
import { canViewReports, canManageRoles } from 'src/utils/permissions';

const SidebarItems = () => {
  const { pathname } = useLocation();
  const pathDirect = pathname;
  const currentUser = useSelector((state) => state.Auth.user);
  const allowReports = canViewReports(currentUser);
  const allowRoleManagement = canManageRoles(currentUser);

  const visibleItems = Menuitems.filter((item) => {
    if (item.href === '/salon-report' && !allowReports) {
      return false;
    }
    if (item.href === '/roles' && !allowRoleManagement) {
      return false;
    }
    return true;
  }).filter((item, index, items) => {
    if (!item.subheader) {
      return true;
    }
    return items.slice(index + 1).some((nextItem) => !nextItem.subheader);
  });

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {visibleItems.map((item) => {
          // {/********SubHeader**********/}
          if (item.subheader) {
            return <NavGroup item={item} key={item.subheader} />;

            // {/********If Sub Menu**********/}
            /* eslint no-else-return: "off" */
          } else {
            return (
              <NavItem item={item} key={item.id} pathDirect={pathDirect} />
            );
          }
        })}
      </List>
    </Box>
  );
};
export default SidebarItems;

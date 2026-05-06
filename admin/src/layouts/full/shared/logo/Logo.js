import { Link } from 'react-router-dom';
import { ReactComponent as LogoDark } from 'src/assets/images/logos/uphaarr-logo.svg';
import { styled, Typography } from '@mui/material';

import uphaarLogo from '../../../../assets/images/logos/uphaarr-logo.png';

const LinkStyled = styled(Link)(() => ({
  height: '70px',
  width: '180px',
  overflow: 'hidden',
  display: 'block',
}));

const Logo = () => {
  return (
    <LinkStyled
      to="/"
      style={{
        height: '118px',
        display: 'flex',
        width: 'unset',
        alignItems: 'center',
        textDecoration: 'none',
      }}
    >
      <Typography variant="h1" sx={{}}>
        Likeme Salon
      </Typography>
      {/* <img src={uphaarLogo} style={{ height: '130px', width: '220px', objectFit: 'cover' }} /> */}
      {/* <LogoDark height={70} /> */}
    </LinkStyled>
  );
};

export default Logo;

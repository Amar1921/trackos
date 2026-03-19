import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getSocket, subscribeToSite, unsubscribeFromSite } from '../services/socket';
import {
  setConnected, setActiveSnapshot, setActiveCount,
  addLiveFeedItem, removeActiveVisitor, addSubscribedSite, removeSubscribedSite,
} from '../features/realtime/realtimeSlice';

export function useSocketInit() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return; // Pas de token → pas de socket

    const socket = getSocket();

    const onConnect    = ()    => dispatch(setConnected(true));
    const onDisconnect = ()    => dispatch(setConnected(false));
    const onSnapshot   = (d)   => dispatch(setActiveSnapshot(d));
    const onCount      = (d)   => dispatch(setActiveCount(d));
    const onNew        = (d)   => dispatch(addLiveFeedItem({ type: 'pageview', ...d }));
    const onLeft       = (d)   => dispatch(removeActiveVisitor(d));

    socket.on('connect',          onConnect);
    socket.on('disconnect',       onDisconnect);
    socket.on('active:snapshot',  onSnapshot);
    socket.on('active:count',     onCount);
    socket.on('visitor:new',      onNew);
    socket.on('visitor:left',     onLeft);

    return () => {
      socket.off('connect',         onConnect);
      socket.off('disconnect',      onDisconnect);
      socket.off('active:snapshot', onSnapshot);
      socket.off('active:count',    onCount);
      socket.off('visitor:new',     onNew);
      socket.off('visitor:left',    onLeft);
    };
  }, [dispatch]);
}

export function useSiteSubscription(site_id) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!site_id) return;
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    subscribeToSite(site_id);
    dispatch(addSubscribedSite(site_id));

    return () => {
      unsubscribeFromSite(site_id);
      dispatch(removeSubscribedSite(site_id));
    };
  }, [site_id, dispatch]);
}

// S'abonner à tous les sites pour que le LiveFeed reçoive les événements de tous les sites
export function useAllSitesSubscription(sites) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!sites || sites.length === 0) return;
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    sites.forEach(site => {
      subscribeToSite(site.id);
      dispatch(addSubscribedSite(site.id));
    });

    return () => {
      sites.forEach(site => {
        unsubscribeFromSite(site.id);
        dispatch(removeSubscribedSite(site.id));
      });
    };
  }, [sites, dispatch]);
}
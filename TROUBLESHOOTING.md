# Miscellaneous

## Common Issues and Solutions

### Backend Issues

**Issue**: ModuleNotFoundError
- **Solution**: Ensure virtual environment is activated and all dependencies are installed

**Issue**: Database locked
- **Solution**: Delete `sustainability.db` and restart the app

**Issue**: Port 5000 already in use
- **Solution**: Change port in `app.py` or kill existing process

### Frontend Issues

**Issue**: CORS errors
- **Solution**: Ensure backend is running and REACT_APP_API_URL is correct

**Issue**: npm packages not installing
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install` again

**Issue**: Port 3000 already in use
- **Solution**: Set PORT environment variable: `PORT=3001 npm start`

## Environment Configuration

### Secrets in Production
- Change JWT_SECRET_KEY to a strong random value
- Use environment variables for sensitive data
- Never commit `.env` file with real secrets

### Database in Production
- Consider using PostgreSQL instead of SQLite
- Set up proper database backups
- Use connection pooling

### API in Production
- Enable HTTPS
- Implement rate limiting
- Add request validation
- Use CORS carefully

## Performance Tips

1. **Frontend**:
   - Use lazy loading for components
   - Optimize images
   - Enable gzip compression

2. **Backend**:
   - Add database indexes
   - Implement caching
   - Use async operations

3. **General**:
   - Monitor API response times
   - Use CDN for static files
   - Set up logging and monitoring

## Scaling Considerations

- Move to cloud database (PostgreSQL)
- Implement caching layer (Redis)
- Use containerization (Docker)
- Set up CI/CD pipeline
- Implement API rate limiting
- Add monitoring and alerting

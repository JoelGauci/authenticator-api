'use strict';

var authenticator = require('authenticator');

module.exports = function(Mfacode) {

  Mfacode.observe('before save', function setSecretKey(ctx, next) {
    if (ctx.instance) {
      ctx.instance.key = authenticator.generateKey();
    } else {
      ctx.data.key = authenticator.generateKey();
    }
    next();
  });

  /**
   * generate a 6 digit code
   * @param {string} id issuer identifier
   * @param {Function(Error, array)} callback
   */

  Mfacode.generateCode = function(id, callback) {

    Mfacode.findById ( id, function ( error, authenticatorResponse ) {
      if ( error ) {
        return callback ( error );
      }
      // set with the customer's account or use default value
      var secretKey = ( authenticatorResponse !== null ) ? authenticatorResponse.key : 'none';
      var formattedToken = authenticator.generateToken ( secretKey );
      var code = {};

      if( secretKey !== 'none' ) {
        code.status = 'success';
        code.digit = formattedToken;
        code.totp = authenticator.generateTotpUri(secretKey, authenticatorResponse.account, authenticatorResponse.issuer, 'SHA1', 6, 30);
        code.validity = 30;
        code.tolerance = '+/- 30';
        code.issuer = authenticatorResponse.issuer;
      } else {
        code.status = 'error';
        code.digit = 'none';
        code.message = 'no secret key found for issuer ' + id;
      }

      // return the 6 digit code into an array
      callback ( null, code );
    } );

  };

  /**
   * verify a 6 digit code
   * @param {string} id issuer identifier
   * @param {string} code 6 digit code to be verified
   * @param {Function(Error, object)} callback
   */

  Mfacode.verifyCode = function(id, code, callback) {

    //console.log("code:%s",code);

    Mfacode.findById ( id, function ( error, authenticatorResponse ) {
      if ( error ) {
        return callback ( error );
      }
      // set with the customer's account or use default value
      var secretKey = ( authenticatorResponse !== null ) ? authenticatorResponse.key : 'none';
      var status = {};
      if( secretKey !== 'none' ) {
        status = authenticator.verifyToken(secretKey, code);
        if( status === null ) {
          status = { delta: 'error', message: 'code not verified' };
        }
      } else {
        status.delta = 'error';
        status.message = 'no secret key found for issuer ' + id;
      }

      // return the 6 digit code into an array
      callback ( null, status );
    } );

  };
};
